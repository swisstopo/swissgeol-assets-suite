import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  numberAttribute,
  OnDestroy,
  output,
  Renderer2,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { PageDimension } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { injectVirtualizer, VirtualItem } from '@tanstack/angular-virtual';
import { showAlert } from '../../state/alert/alert.actions';
import { AlertType } from '../../state/alert/alert.model';
import { triggerDownload } from '../../utils';
import { PdfViewerApiService } from './pdf-viewer-api.service';
import { PdfViewerHeaderComponent } from './pdf-viewer-header/pdf-viewer-header.component';
import { PdfViewerInputService } from './pdf-viewer-input.service';
import {
  findPageAtScrollOffset,
  getBaseScale,
  getConfiguredInteger,
  getDocumentWidth,
  getPageLayout,
  getPageWidth,
  isRotationSwapped,
} from './pdf-viewer-layout.helper';
import {
  PdfNavigationAction,
  PdfViewerNavigationComponent,
} from './pdf-viewer-navigation/pdf-viewer-navigation.component';
import { PdfViewerRendererService } from './pdf-viewer-renderer.service';
import { PdfViewerRotateComponent } from './pdf-viewer-rotate/pdf-viewer-rotate.component';
import { PdfViewerTocComponent } from './pdf-viewer-toc/pdf-viewer-toc.component';
import { PdfViewerZoomComponent, PdfZoomAction } from './pdf-viewer-zoom/pdf-viewer-zoom.component';
import {
  CURRENT_PAGE_CHANGE_RENDER_DELAY_MS,
  DEFAULT_MAX_CONCURRENT_PAGE_LOADS,
  DEFAULT_OVERSCAN,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  PDF_VIEWER_DEBUG,
  PDF_RENDERING_MARGIN,
  PdfViewerFile,
  PdfRenderMode,
  PdfViewerVirtualItem,
  VIRTUAL_GAP,
  VIRTUAL_PADDING,
  ZOOM_STEP,
  ZOOM_STEP_FINE,
} from './pdf-viewer.models';
import { PdfViewerService } from './pdf-viewer.service';

@Component({
  selector: 'asset-sg-pdf-viewer',
  imports: [
    CommonModule,
    MatProgressBar,
    PdfViewerNavigationComponent,
    PdfViewerZoomComponent,
    PdfViewerRotateComponent,
    PdfViewerHeaderComponent,
    PdfViewerTocComponent,
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss',
  providers: [PdfViewerService, PdfViewerInputService, PdfViewerRendererService],
})
export class PdfViewerComponent implements OnDestroy {
  public readonly hideHeader = input(false);
  public readonly hideCloseButton = input(false);
  public readonly hideDownloadButton = input(false);
  public readonly hidePdfSelection = input(false);
  public readonly assetId = input.required<number>();
  public readonly assetPdfs = input.required<PdfViewerFile[]>();
  public readonly initialPdfId = input<number>();
  public readonly initialPageNumber = input<number>();
  public readonly overscan = input(DEFAULT_OVERSCAN, {
    transform: numberAttribute,
  });
  public readonly maxConcurrentPageLoads = input(DEFAULT_MAX_CONCURRENT_PAGE_LOADS, { transform: numberAttribute });
  public readonly exitViewer = output();

  protected readonly currentPage = signal(-1);
  protected readonly hasError = signal(false);
  protected readonly pageCount = signal(0);
  protected readonly isRendering = signal(true);
  protected readonly isSpacePanMode = signal(false);
  protected readonly isPanning = signal(false);
  protected readonly zoom = signal(1);
  protected readonly rotation = signal(0);
  protected readonly selectedPdf = signal<PdfViewerFile | undefined>(undefined);
  protected readonly virtualItems = signal<PdfViewerVirtualItem[]>([]);
  protected readonly virtualTotalSize = signal(0);
  protected readonly virtualContentWidth = signal(0);
  protected readonly pageDimensions = signal<PageDimension[]>([]);
  protected readonly baseScale = signal(1);
  protected readonly maxZoomLevel = MAX_ZOOM_LEVEL;
  protected readonly minZoomLevel = MIN_ZOOM_LEVEL;
  protected readonly pdfViewerService = inject(PdfViewerService);

  private readonly pdfElement = viewChild<ElementRef<HTMLDivElement>>('pdf');
  private readonly renderer = inject(Renderer2);
  private readonly store = inject(Store);
  private readonly translateService = inject(TranslateService);
  private readonly pdfViewerApiService = inject(PdfViewerApiService);
  private readonly ngZone = inject(NgZone);
  private readonly pdfViewerInputService = inject(PdfViewerInputService);
  private readonly pdfViewerRendererService = inject(PdfViewerRendererService);

  private resizeObserver: ResizeObserver | null = null;
  private scrollRenderTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollAnimationFrame: number | null = null;
  private zoomAnimationFrame: number | null = null;

  private renderPassInFlight = false;
  private renderPassQueued = false;
  private pendingVirtualMeasure = false;
  private pendingCanvasRefresh = false;
  private pendingHorizontalScrollRatio: number | null = null;
  private pendingInitialPage: number | null = null;
  private viewportEpoch = 0;

  private loadGeneration = 0;
  private lastVirtualItemsSignature = '';
  private renderMode: PdfRenderMode = 'normal';
  private pendingZoomTarget: number | null = null;
  private zoomAnchorPageNumber: number | null = null;
  private pendingZoomReanchorPageNumber: number | null = null;
  private pendingZoomScrollTop: number | null = null;
  private pendingZoomScrollLeft: number | null = null;
  private pendingWheelZoomMouseOffsetY: number | null = null;
  private pendingWheelZoomMouseOffsetX: number | null = null;
  private programmaticScrollDepth = 0;
  private pinnedPageNumber: number | null = null;

  // estimateSize must read plain fields, not signals.
  private _estimateZoom = 1;
  private _estimateScale = 1;
  private _estimateRotation = 0;
  private _estimateDims: PageDimension[] = [];

  protected readonly virtualizer = injectVirtualizer<HTMLDivElement, HTMLElement>(() => ({
    count: this.pageCount(),
    scrollElement: this.pdfElement(),
    estimateSize: (index: number) => {
      const dim = this._estimateDims[index];
      if (!dim) return 300;
      const isSwapped = isRotationSwapped(this._estimateRotation);
      const nativeHeight = isSwapped ? dim.width : dim.height;
      return Math.round(nativeHeight * this._estimateScale * this._estimateZoom);
    },
    overscan: this.getConfiguredOverscan(),
    paddingStart: VIRTUAL_PADDING,
    paddingEnd: VIRTUAL_PADDING,
    gap: VIRTUAL_GAP,
  }));

  constructor() {
    this.setupInitialPdfEffect();
    this.setupRenderingEffect();
    this.setupAssetPdfChangeEffect();
    afterNextRender(() => this.setupInputHandlers());
  }

  public ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.pdfViewerInputService.destroy();
    if (this.scrollRenderTimer) {
      clearTimeout(this.scrollRenderTimer);
    }
    if (this.scrollAnimationFrame !== null) {
      cancelAnimationFrame(this.scrollAnimationFrame);
    }
    if (this.zoomAnimationFrame !== null) {
      cancelAnimationFrame(this.zoomAnimationFrame);
    }
  }

  protected onViewerMouseDown(event: MouseEvent) {
    this.pdfViewerInputService.startPanDrag(event);
  }

  protected onViewerPointerDown(event: PointerEvent) {
    this.pdfViewerInputService.startPanDrag(event);
  }

  protected closeViewer() {
    this.exitViewer.emit();
  }

  protected navigateToPage(pageNum: number) {
    if (pageNum >= 1 && pageNum <= this.pageCount()) {
      this.scrollToPage(pageNum);
    }
  }

  protected handleNavigation($event: PdfNavigationAction) {
    switch ($event) {
      case 'next':
        this.navigateToPage(this.currentPage() + 1);
        break;
      case 'previous':
        this.navigateToPage(this.currentPage() - 1);
        break;
      case 'start':
        this.navigateToPage(1);
        break;
      case 'end':
        this.navigateToPage(this.pageCount());
        break;
    }
  }

  protected handleRotation() {
    this.rotation.update((value) => (value + 90) % 360);
    this.viewportEpoch++;
    this.scheduleVirtualRefresh(this.captureHorizontalScrollRatio());
  }

  protected handleZoom(action: PdfZoomAction) {
    this.ngZone.runOutsideAngular(() => this.scheduleZoom(action));
  }

  private handleWheelZoom(accumulatedDeltaY: number, mouseClientY: number, mouseClientX: number): void {
    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) return;
    const rect = scrollEl.getBoundingClientRect();
    // Store cursor offsets relative to the scroll container for cursor-centred zoom.
    this.pendingWheelZoomMouseOffsetY = mouseClientY - rect.top;
    this.pendingWheelZoomMouseOffsetX = mouseClientX - rect.left;
    this.ngZone.runOutsideAngular(() => {
      // Always use ZOOM_STEP_FINE for wheel zoom so each scroll notch is a small
      // increment — prevents large jumps when zoom is above 1.
      const current = this.pendingZoomTarget ?? this.zoom();
      const target = accumulatedDeltaY > 0 ? current - ZOOM_STEP_FINE : current + ZOOM_STEP_FINE;
      const clamped = this.normalizeZoom(target);
      if (Math.abs(clamped - this.zoom()) < 0.0001 && this.pendingZoomTarget === null) return;
      this.pendingZoomTarget = clamped;
      if (this.zoomAnimationFrame !== null) return;
      this.zoomAnimationFrame = requestAnimationFrame(() => {
        this.zoomAnimationFrame = null;
        this.commitPendingZoom();
      });
    });
  }

  private scheduleZoom(action: PdfZoomAction): void {
    const current = this.pendingZoomTarget ?? this.zoom();
    let target = current;
    const step = current < 1 ? ZOOM_STEP_FINE : ZOOM_STEP;
    switch (action) {
      case 'in':
        target = current + step;
        break;
      case 'out':
        target = current - step;
        break;
      case 'reset':
        target = 1;
        break;
    }

    const clampedTarget = this.normalizeZoom(target);
    if (Math.abs(clampedTarget - this.zoom()) < 0.0001 && this.pendingZoomTarget === null) return;
    this.logJumpDebug('schedule-zoom', {
      action,
      currentZoom: current,
      requestedZoom: target,
      clampedTargetZoom: clampedTarget,
      pendingZoomTarget: this.pendingZoomTarget,
    });

    this.pendingZoomTarget = clampedTarget;
    if (this.zoomAnimationFrame !== null) return;

    this.zoomAnimationFrame = requestAnimationFrame(() => {
      this.zoomAnimationFrame = null;
      this.commitPendingZoom();
    });
  }

  private commitPendingZoom(): void {
    const target = this.pendingZoomTarget;
    if (target === null) return;
    this.logJumpDebug('commit-zoom-start', { targetZoom: target });

    this.pendingZoomTarget = null;

    // Capture pre-zoom state so we can compute exact scroll positions after zoom.
    // When rapid CTRL+wheel zoom commits faster than the render pass can apply them,
    // the DOM scroll positions are stale. Use the pending values (which represent the
    // intended state for the current zoom level) to keep the anchor calculation correct.
    const oldZoom = this.zoom();
    const scrollEl = this.pdfElement()?.nativeElement;
    const scrollTop = this.pendingZoomScrollTop ?? scrollEl?.scrollTop ?? 0;
    const scrollLeft = this.pendingZoomScrollLeft ?? scrollEl?.scrollLeft ?? 0;
    const mouseOffsetY = this.pendingWheelZoomMouseOffsetY;
    const mouseOffsetX = this.pendingWheelZoomMouseOffsetX;
    this.pendingWheelZoomMouseOffsetY = null;
    this.pendingWheelZoomMouseOffsetX = null;

    if (!this.setZoom(target)) return;

    const newZoom = this.zoom();
    const pageDims = this.pageDimensions();
    const pageCount = this.pageCount();
    const baseScl = this.baseScale();
    const rotation = this.rotation();

    const zoomAnchorPage = this.zoomAnchorPageNumber ?? this.pinnedPageNumber ?? this.getCurrentPageFromVirtualizer();
    this.zoomAnchorPageNumber = zoomAnchorPage;
    this.pendingZoomReanchorPageNumber = zoomAnchorPage;
    this.pinnedPageNumber = zoomAnchorPage;
    this.logJumpDebug('commit-zoom-anchor-page', { zoomAnchorPage });

    let horizontalRatio: number | null = null;

    // Compute the new scrollTop/scrollLeft that keeps the visual anchor in place.
    if (scrollEl && pageDims.length > 0) {
      const containerWidth = scrollEl.clientWidth;
      const contentWidthOld = getDocumentWidth(pageDims, containerWidth, baseScl, oldZoom, rotation);
      const contentWidthNew = getDocumentWidth(pageDims, containerWidth, baseScl, newZoom, rotation);

      if (mouseOffsetY !== null && mouseOffsetX !== null) {
        // CTRL+wheel: both axes anchor to the cursor position.
        // Vertical — keep the document point under the cursor at the same screen Y.
        const cursorDocY = scrollTop + mouseOffsetY;
        const pageAtCursor = findPageAtScrollOffset(cursorDocY, pageCount, pageDims, baseScl, oldZoom, rotation);
        if (pageAtCursor) {
          const ratio = pageAtCursor.size > 0 ? (cursorDocY - pageAtCursor.start) / pageAtCursor.size : 0;
          const newPageLayout = getPageLayout(pageAtCursor.pageNum, pageCount, pageDims, baseScl, newZoom, rotation);
          if (newPageLayout) {
            const newDocY = newPageLayout.start + ratio * newPageLayout.size;
            this.pendingZoomScrollTop = Math.max(0, newDocY - mouseOffsetY);
          }
        }
        // Horizontal — pages are CSS-centred inside the virtual spacer, so we must
        // anchor to the distance from the page centre, not from scroll origin 0.
        // contentWidthOld/New accounts for the min-width clamping at zoom < 1.
        const dX = scrollLeft + mouseOffsetX - contentWidthOld / 2;
        const newScrollLeft = contentWidthNew / 2 + dX * (newZoom / oldZoom) - mouseOffsetX;
        const newMaxScrollLeft = Math.max(0, contentWidthNew - containerWidth);
        this.pendingZoomScrollLeft = Math.max(0, Math.min(newScrollLeft, newMaxScrollLeft));
      } else {
        // Button zoom: preserve the relative position within the anchor page (vertical)
        // and the current horizontal scroll ratio.
        const anchorLayout = getPageLayout(zoomAnchorPage, pageCount, pageDims, baseScl, oldZoom, rotation);
        if (anchorLayout && anchorLayout.size > 0) {
          const ratio = (scrollTop - anchorLayout.start) / anchorLayout.size;
          const newAnchorLayout = getPageLayout(zoomAnchorPage, pageCount, pageDims, baseScl, newZoom, rotation);
          if (newAnchorLayout) {
            this.pendingZoomScrollTop = Math.max(0, newAnchorLayout.start + ratio * newAnchorLayout.size);
          }
        }
        // Horizontal: preserve the current proportional position.
        // When there is no overflow (zoom ≤ 1) the only sensible starting position
        // is the centre (0.5), so crossing into zoom > 1 stays centred rather than
        // snapping to the left edge.
        const maxScrollLeftOld = Math.max(0, contentWidthOld - containerWidth);
        const maxScrollLeftNew = Math.max(0, contentWidthNew - containerWidth);
        horizontalRatio = maxScrollLeftOld > 0 ? scrollLeft / maxScrollLeftOld : 0.5;
        this.pendingZoomScrollLeft = Math.max(0, horizontalRatio * maxScrollLeftNew);
        horizontalRatio = null;
      }
    }

    this.renderMode = 'zoom';
    this.viewportEpoch++;
    this.pdfViewerRendererService.prepareForZoomRender();
    this.scheduleVirtualRefresh(horizontalRatio);
  }

  protected onCloseViewer() {
    this.closeViewer();
  }

  protected downloadPdf() {
    this.pdfViewerApiService
      .fetchPresignedDownloadUrl(this.assetId(), this.selectedPdf()!.id)
      .then(({ url }) => triggerDownload(url, true));
  }

  private setupInputHandlers(): void {
    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) {
      return;
    }

    this.pdfViewerInputService.setup(scrollEl, {
      getScrollElement: () => this.pdfElement()?.nativeElement,
      getCurrentPage: () => this.currentPage(),
      onScroll: () => this.handleViewerScroll(),
      navigateToPage: (pageNum) => this.navigateToPage(pageNum),
      setSpacePanMode: (enabled) => this.isSpacePanMode.set(enabled),
      setPanning: (enabled) => this.isPanning.set(enabled),
      onWheelZoom: (deltaY, mouseClientY, mouseClientX) => this.handleWheelZoom(deltaY, mouseClientY, mouseClientX),
    });
  }

  private handleViewerScroll(): void {
    if (this.pageCount() === 0) return;
    if (this.renderMode === 'zoom') return;
    if (this.programmaticScrollDepth > 0) return;
    if (this.scrollAnimationFrame !== null) return;
    this.scrollAnimationFrame = requestAnimationFrame(() => {
      this.scrollAnimationFrame = null;
      this.processViewerScroll();
    });
  }

  private processViewerScroll(): void {
    if (this.pageCount() === 0) return;
    this.pinnedPageNumber = null;
    const previousPage = this.currentPage();
    const items = this.syncVirtualViewport();
    this.updateCurrentPage(items);
    // Update which pages the render service considers visible so the
    // .finally() cascade in drainSlots() picks pages from the current viewport.
    this.pdfViewerRendererService.updateVisiblePages(items);
    if (this.currentPage() !== previousPage) {
      // Page changed — debounce so rapid page changes don't flood renders.
      this.scheduleScrollRender();
    } else if (!this.scrollRenderTimer) {
      // Same page and no pending page-change debounce — render immediately
      // so slow scrolling fills in visible pages.
      this.scheduleRender();
    }
  }

  private setupInitialPdfEffect() {
    const effectRef = effect(
      () => {
        if (this.assetPdfs().length > 0) {
          let initialPdf: PdfViewerFile | undefined;
          const initialPdfId = this.initialPdfId();
          if (initialPdfId) {
            initialPdf = this.assetPdfs().find((pdf) => pdf.id === initialPdfId);
          }
          this.selectedPdf.set(initialPdf ?? this.assetPdfs()[0]);
          effectRef.destroy();
        }
      },
      { manualCleanup: true },
    );
  }

  private setupAssetPdfChangeEffect() {
    effect(() => {
      const selectedPdf = untracked(() => this.selectedPdf());

      if (selectedPdf) {
        if (!this.assetPdfs().some((f) => f.id === selectedPdf.id && f.fileName === selectedPdf.fileName)) {
          this.selectedPdf.set(this.assetPdfs()[0]);

          this.store.dispatch(
            showAlert({
              alert: {
                id: `pdf-notice-${this.assetId()}-${this.selectedPdf()?.id}`,
                text: this.translateService.instant('pdfNoLongerAvailable'),
                type: AlertType.Warning,
                isPersistent: false,
              },
            }),
          );
        }
      }
    });
  }

  private setupRenderingEffect() {
    let isFirstRun = true;

    effect(async () => {
      const selectedPdf = this.selectedPdf();
      if (this.pdfElement() && selectedPdf) {
        await this.loadPdf(selectedPdf.id, isFirstRun ? this.initialPageNumber() : 1);
        isFirstRun = false;
      }
    });
  }

  private async loadPdf(pdfId: number, initialPage = 1) {
    this.resizeObserver?.disconnect();
    this.pdfViewerRendererService.resetPages();
    this.pdfViewerInputService.finishPanDrag();

    this.pageCount.set(0);
    this.virtualItems.set([]);
    this.virtualTotalSize.set(0);
    this.virtualContentWidth.set(0);
    this.pageDimensions.set([]);
    this.baseScale.set(1);
    this.zoom.set(1);
    this.rotation.set(0);
    this.currentPage.set(-1);
    this.hasError.set(false);
    this.isRendering.set(true);

    this.pendingVirtualMeasure = false;
    this.pendingCanvasRefresh = false;
    this.pendingHorizontalScrollRatio = null;
    this.pendingInitialPage = null;
    this.lastVirtualItemsSignature = '';
    this.renderMode = 'normal';
    this.pendingZoomTarget = null;
    this.zoomAnchorPageNumber = null;
    this.pendingZoomReanchorPageNumber = null;
    this.pendingZoomScrollTop = null;
    this.pendingZoomScrollLeft = null;
    this.pendingWheelZoomMouseOffsetY = null;
    this.pendingWheelZoomMouseOffsetX = null;
    this.programmaticScrollDepth = 0;
    this.pinnedPageNumber = null;
    if (this.zoomAnimationFrame !== null) {
      cancelAnimationFrame(this.zoomAnimationFrame);
      this.zoomAnimationFrame = null;
    }

    this._estimateZoom = 1;
    this._estimateScale = 1;
    this._estimateRotation = 0;
    this._estimateDims = [];

    this.viewportEpoch++;
    const generation = ++this.loadGeneration;

    try {
      const [numPages, metadata] = await Promise.all([
        this.pdfViewerService.loadPdf(this.assetId(), pdfId),
        this.pdfViewerApiService.fetchMetadata(this.assetId(), pdfId),
      ]);

      if (this.loadGeneration !== generation) return;

      let dims = metadata.pageDimensions;
      if (dims.length === 0 && numPages > 0) {
        const firstPage = await this.pdfViewerService.getPageDimensions(1);
        dims = Array.from(
          { length: numPages },
          (_, index): PageDimension => ({
            page: index + 1,
            width: firstPage.width,
            height: firstPage.height,
          }),
        );
      }

      const scrollEl = this.pdfElement()?.nativeElement;
      if (!scrollEl) return;

      const containerWidth = scrollEl.getBoundingClientRect().width * PDF_RENDERING_MARGIN;
      const newBaseScale = getBaseScale(dims, containerWidth);

      this._estimateZoom = 1;
      this._estimateScale = newBaseScale;
      this._estimateRotation = 0;
      this._estimateDims = dims;

      this.baseScale.set(newBaseScale);
      this.pageDimensions.set(dims);
      this.updateVirtualContentWidth();
      this.pageCount.set(numPages);
      this.virtualizer.measure();

      this.isRendering.set(false);
      await this.waitForDom();
      this.initializeResizeObserver();

      if (initialPage && initialPage > 1) {
        this.pendingInitialPage = initialPage;
      }

      this.pendingCanvasRefresh = true;
      this.scheduleRender();
    } catch (e) {
      this.hasError.set(true);
      this.store.dispatch(
        showAlert({
          alert: {
            id: `pdf-error-${this.assetId()}-${this.selectedPdf()?.id}`,
            text: this.translateService.instant('downloadFailed'),
            type: AlertType.Error,
            isPersistent: true,
          },
        }),
      );
      throw e;
    }
  }

  private initializeResizeObserver() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        const el = this.pdfElement()?.nativeElement;
        if (!el) return;

        const dims = this.pageDimensions();
        if (dims.length === 0) return;

        const containerWidth = el.getBoundingClientRect().width * PDF_RENDERING_MARGIN;
        const nextScale = getBaseScale(dims, containerWidth);
        if (Math.abs(nextScale - this.baseScale()) < 0.0001) return;

        const horizontalRatio = this.captureHorizontalScrollRatio();
        this.baseScale.set(nextScale);
        this.viewportEpoch++;
        this.scheduleVirtualRefresh(horizontalRatio);
      });
    });

    const el = this.pdfElement()?.nativeElement;
    if (el) {
      this.resizeObserver.observe(el);
    }
  }

  private scheduleVirtualRefresh(horizontalRatio: number | null = null) {
    if (horizontalRatio !== null) {
      this.pendingHorizontalScrollRatio = horizontalRatio;
    }
    this.pendingVirtualMeasure = true;
    this.pendingCanvasRefresh = true;
    this.scheduleRender();
  }

  private scheduleRender() {
    this.ngZone.runOutsideAngular(() => this.runRenderPass());
  }

  private scheduleScrollRender() {
    this.ngZone.runOutsideAngular(() => {
      if (this.scrollRenderTimer) {
        clearTimeout(this.scrollRenderTimer);
      }
      this.scrollRenderTimer = setTimeout(() => {
        this.scrollRenderTimer = null;
        this.runRenderPass();
      }, CURRENT_PAGE_CHANGE_RENDER_DELAY_MS);
    });
  }

  private cancelScrollRenderTimer() {
    if (this.scrollRenderTimer) {
      clearTimeout(this.scrollRenderTimer);
      this.scrollRenderTimer = null;
    }
  }

  private runRenderPass() {
    if (this.renderPassInFlight) {
      this.renderPassQueued = true;
      return;
    }

    this.renderPassInFlight = true;
    void this.renderVisiblePages()
      .catch((error) => {
        console.error('Failed to render visible pages', error);
      })
      .finally(() => {
        this.renderPassInFlight = false;
        if (this.renderPassQueued) {
          this.renderPassQueued = false;
          this.scheduleRender();
        }
      });
  }

  private async renderVisiblePages() {
    let virtualSizesChanged = false;
    if (this.pendingVirtualMeasure) {
      this.syncEstimateFields();
      this.updateVirtualContentWidth();
      this.virtualizer.measure();
      this.pendingVirtualMeasure = false;
      virtualSizesChanged = true;
    }

    if (this.pendingZoomReanchorPageNumber !== null) {
      const zoomAnchorPage = this.pendingZoomReanchorPageNumber;
      this.pendingZoomReanchorPageNumber = null;
      const pendingScrollTop = this.pendingZoomScrollTop;
      this.pendingZoomScrollTop = null;
      if (zoomAnchorPage >= 1 && zoomAnchorPage <= this.pageCount()) {
        const scrollEl = this.pdfElement()?.nativeElement;
        if (scrollEl) {
          if (pendingScrollTop !== null) {
            // Set the exact scroll position computed in commitPendingZoom() so the
            // anchor point stays visually stable across zoom changes.
            this.runProgrammaticScroll(() => {
              scrollEl.scrollTop = pendingScrollTop;
            });
          } else {
            // Fallback: align to page start (avoids the 'auto' jump-to-bottom bug).
            this.runProgrammaticScroll(() => {
              this.virtualizer.scrollToIndex(zoomAnchorPage - 1, { align: 'start', behavior: 'auto' });
            });
          }
        }
        this.logJumpDebug('zoom-pass-scroll-to-anchor', { zoomAnchorPage, pendingScrollTop });
      }
    }

    if (this.pendingCanvasRefresh) {
      // Keep old bitmaps visible until replacement canvases have finished rendering.
      this.pendingCanvasRefresh = false;
    }

    this.syncVirtualViewport();
    await this.waitForDom();

    if (virtualSizesChanged) {
      // After a zoom/rotation/resize the virtual window may contain new page slots
      // that Angular hasn't rendered yet.  Running outside NgZone means Angular
      // schedules its change-detection via requestAnimationFrame; a second rAF
      // here ensures those DOM elements exist before we try to query them.
      await this.waitForDom();
    }

    if (this.pendingZoomScrollLeft !== null) {
      const pendingScrollLeft = this.pendingZoomScrollLeft;
      this.pendingZoomScrollLeft = null;
      const scrollEl = this.pdfElement()?.nativeElement;
      if (scrollEl) {
        this.runProgrammaticScroll(() => {
          scrollEl.scrollLeft = pendingScrollLeft;
        });
      }
    } else if (this.pendingHorizontalScrollRatio !== null) {
      this.applyHorizontalScrollRatio(this.pendingHorizontalScrollRatio);
      this.pendingHorizontalScrollRatio = null;
    }

    if (this.pendingInitialPage !== null) {
      const page = this.pendingInitialPage;
      this.pendingInitialPage = null;
      this.runProgrammaticScroll(() => {
        this.virtualizer.scrollToIndex(page - 1, { align: 'start', behavior: 'auto' });
      });
      // Wait an extra frame so the browser scroll event fires and TanStack Virtual
      // updates its internal scrollOffset before we read virtual items.
      await this.waitForDom();
    }

    const items = this.syncVirtualViewport();
    this.syncCurrentPage(items);
    // viewportEpoch is bumped only on real render-parameter changes (zoom commit,
    // rotation, resize, document load). A render pass triggered by scroll alone keeps
    // the existing epoch so still-visible in-flight renders are not cancelled.
    const renderEpoch = this.viewportEpoch;

    if (this.renderMode === 'normal') {
      this.evictPagesOutside(items);
    }

    const expectedZoom = this.zoom();
    const expectedRotation = this.rotation();
    const renderMode = this.renderMode;
    this.queueVisiblePageRenders(items, expectedZoom, expectedRotation, renderEpoch, renderMode);
    this.releasePagePinIfIdle(items);
  }

  private syncCurrentPage(items: PdfViewerVirtualItem[]): void {
    if (this.pinnedPageNumber !== null) {
      if (this.currentPage() !== this.pinnedPageNumber) {
        this.currentPage.set(this.pinnedPageNumber);
      }
      return;
    }

    this.updateCurrentPage(items);
  }

  private getEffectiveCurrentPage(fallbackPageNum: number): number {
    if (this.pinnedPageNumber !== null) {
      return this.pinnedPageNumber;
    }
    return this.currentPage() > 0 ? this.currentPage() : fallbackPageNum;
  }

  private releasePagePinIfIdle(items: PdfViewerVirtualItem[]): void {
    if (this.renderMode !== 'normal' || this.pinnedPageNumber === null) return;

    this.pinnedPageNumber = null;
    this.updateCurrentPage(items);
  }

  private syncVirtualViewport(): PdfViewerVirtualItem[] {
    const items = this.virtualizer.getVirtualItems().map((item) => this.toPdfViewerVirtualItem(item));
    const totalSize = this.virtualizer.getTotalSize();
    const signature = this.getVirtualItemsSignature(items);

    if (signature !== this.lastVirtualItemsSignature) {
      this.virtualItems.set(items);
      this.lastVirtualItemsSignature = signature;
    }
    if (totalSize !== this.virtualTotalSize()) {
      this.virtualTotalSize.set(totalSize);
    }
    return items;
  }

  private toPdfViewerVirtualItem(item: VirtualItem): PdfViewerVirtualItem {
    const pageNum = item.index + 1;
    return {
      index: item.index,
      key: item.key,
      start: item.start,
      end: item.end,
      size: item.size,
      pageNum,
      pageWidth: this.getPageWidth(pageNum),
      transform: `translateY(${item.start}px)`,
    };
  }

  private getVirtualItemsSignature(items: PdfViewerVirtualItem[]): string {
    return items.map((item) => `${item.key}:${item.start}:${item.size}:${item.pageWidth}`).join('|');
  }

  private evictPagesOutside(items: PdfViewerVirtualItem[]): void {
    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) return;

    this.pdfViewerRendererService.evictPagesOutside(items, scrollEl, this.renderer);
  }

  private queueVisiblePageRenders(
    items: PdfViewerVirtualItem[],
    expectedZoom: number,
    expectedRotation: number,
    renderEpoch: number,
    renderMode: PdfRenderMode,
  ): void {
    if (items.length === 0) {
      this.pdfViewerRendererService.updateVisiblePages([]);
      return;
    }

    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) return;

    const effectiveCurrentPage = this.getEffectiveCurrentPage(items[0]?.pageNum ?? 1);
    const currentPageForRender =
      renderMode === 'zoom' && !items.some((item) => item.pageNum === effectiveCurrentPage)
        ? (items[0]?.pageNum ?? effectiveCurrentPage)
        : effectiveCurrentPage;
    if (renderMode === 'zoom' && currentPageForRender !== effectiveCurrentPage) {
      this.logJumpDebug('zoom-render-page-fallback', {
        effectiveCurrentPage,
        fallbackPage: currentPageForRender,
      });
    }

    this.pdfViewerRendererService.queueVisiblePageRenders({
      items,
      currentPage: currentPageForRender,
      expectedZoom,
      expectedRotation,
      maxConcurrentPageLoads: this.getConfiguredMaxConcurrentPageLoads(),
      scrollElement: scrollEl,
      renderer: this.renderer,
      pageDimensions: this.pageDimensions(),
      baseScale: this.baseScale(),
      loadGeneration: this.loadGeneration,
      getViewportEpoch: () => this.viewportEpoch,
      getLoadGeneration: () => this.loadGeneration,
      getZoom: () => this.zoom(),
      getRotation: () => this.rotation(),
      getCurrentPage: () => currentPageForRender,
      getRenderMode: () => this.renderMode,
      scheduleVirtualRefresh: () => this.scheduleVirtualRefresh(),
      renderMode,
      onCurrentPageRendered:
        renderMode === 'zoom' ? () => this.handleZoomCurrentPageRendered(expectedZoom, renderEpoch) : undefined,
    });
  }

  private updateCurrentPage(items: PdfViewerVirtualItem[]) {
    if (items.length === 0) return;
    const el = this.pdfElement()?.nativeElement;
    if (!el) return;

    const firstItem = items[0];
    if (!firstItem) return;

    // When multiple pages fit in the viewport (zoomed out), pick the page whose
    // top edge is closest to the scroll top — consistent with align:'start' navigation.
    // When a single large page fills the viewport, use its center instead.
    const multiPageMode = firstItem.size < el.clientHeight;
    const reference = multiPageMode ? el.scrollTop : el.scrollTop + el.clientHeight / 2;

    let closest = firstItem;
    let distance = Infinity;

    for (const item of items) {
      const itemRef = multiPageMode ? item.start : (item.start + item.end) / 2;
      const itemDistance = Math.abs(itemRef - reference);
      if (itemDistance < distance) {
        distance = itemDistance;
        closest = item;
      }
    }

    const pageNum = closest.index + 1;
    if (pageNum !== this.currentPage()) {
      this.currentPage.set(pageNum);
    }
  }

  private getCurrentPageFromVirtualizer(): number {
    const items = this.virtualizer.getVirtualItems();
    const el = this.pdfElement()?.nativeElement;
    const fallbackPage = this.currentPage() > 0 ? this.currentPage() : 1;
    if (items.length === 0 || !el) return fallbackPage;

    const firstItem = items[0];
    if (!firstItem) return fallbackPage;

    const multiPageMode = firstItem.size < el.clientHeight;
    const reference = multiPageMode ? el.scrollTop : el.scrollTop + el.clientHeight / 2;

    let closest = firstItem;
    let distance = Infinity;
    for (const item of items) {
      const itemRef = multiPageMode ? item.start : (item.start + item.end) / 2;
      const itemDistance = Math.abs(itemRef - reference);
      if (itemDistance < distance) {
        distance = itemDistance;
        closest = item;
      }
    }

    return closest.index + 1;
  }

  private scrollToPage(pageNum: number, behavior: ScrollBehavior = 'smooth') {
    this.virtualizer.scrollToIndex(pageNum - 1, { align: 'start', behavior });
    if (behavior === 'smooth') {
      this.scheduleScrollRender();
    } else {
      this.scheduleRender();
    }
  }

  protected getPageWidth(pageNum: number): number {
    return getPageWidth(pageNum, this.pageDimensions(), this.baseScale(), this.zoom(), this.rotation());
  }

  private getDocumentWidth(): number {
    const containerWidth = this.pdfElement()?.nativeElement.clientWidth ?? 0;
    return getDocumentWidth(this.pageDimensions(), containerWidth, this.baseScale(), this.zoom(), this.rotation());
  }

  private updateVirtualContentWidth(): void {
    this.virtualContentWidth.set(this.getDocumentWidth());
  }

  private getConfiguredOverscan(): number {
    return getConfiguredInteger(this.overscan(), DEFAULT_OVERSCAN, 0);
  }

  private getConfiguredMaxConcurrentPageLoads(): number {
    return getConfiguredInteger(this.maxConcurrentPageLoads(), DEFAULT_MAX_CONCURRENT_PAGE_LOADS, 1);
  }

  private captureHorizontalScrollRatio(): number | null {
    const el = this.pdfElement()?.nativeElement;
    if (!el) return null;

    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    return maxScrollLeft > 0 ? el.scrollLeft / maxScrollLeft : 0;
  }

  private applyHorizontalScrollRatio(ratio: number): void {
    const el = this.pdfElement()?.nativeElement;
    if (!el) return;

    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    this.runProgrammaticScroll(() => {
      el.scrollLeft = this.clamp(ratio, 0, 1) * maxScrollLeft;
    });
  }

  private runProgrammaticScroll(update: () => void): void {
    this.programmaticScrollDepth++;
    try {
      update();
    } finally {
      requestAnimationFrame(() => {
        this.programmaticScrollDepth = Math.max(0, this.programmaticScrollDepth - 1);
      });
    }
  }

  private syncEstimateFields() {
    this._estimateZoom = this.zoom();
    this._estimateScale = this.baseScale();
    this._estimateRotation = this.rotation();
    this._estimateDims = this.pageDimensions();
  }

  private handleZoomCurrentPageRendered(expectedZoom: number, renderEpoch: number): void {
    if (this.renderMode !== 'zoom') return;
    if (Math.abs(this.zoom() - expectedZoom) >= 0.0001) return;
    if (this.viewportEpoch !== renderEpoch) return;
    if (this.pendingZoomTarget !== null || this.zoomAnimationFrame !== null) return;

    this.logJumpDebug('zoom-complete-normal', { zoomAnchorPage: this.zoomAnchorPageNumber });
    this.renderMode = 'normal';
    this.zoomAnchorPageNumber = null;
    this.scheduleRender();
  }

  private setZoom(target: number): boolean {
    const clamped = this.normalizeZoom(target);
    if (Math.abs(clamped - this.zoom()) < 0.0001) return false;
    this.zoom.set(clamped);
    return true;
  }

  private normalizeZoom(target: number): number {
    const clamped = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, target));
    return Math.round(clamped * 1000) / 1000;
  }

  private logJumpDebug(event: string, details: Record<string, unknown> = {}): void {
    if (!PDF_VIEWER_DEBUG) return;

    const el = this.pdfElement()?.nativeElement;
    const items = this.virtualizer.getVirtualItems();
    const firstPage = items[0]?.index == null ? null : items[0].index + 1;
    const lastPage = items[items.length - 1]?.index == null ? null : items[items.length - 1].index + 1;
    const virtualRange = firstPage !== null && lastPage !== null ? `${firstPage}-${lastPage}` : 'none';

    console.log(
      '%c[pdf-jump-debug]',
      'background: #6f42c1; color: white; padding: 2px 6px; border-radius: 4px;',
      event,
      {
        ...details,
        zoom: this.zoom(),
        renderMode: this.renderMode,
        currentPage: this.currentPage(),
        pinnedPage: this.pinnedPageNumber,
        zoomAnchorPage: this.zoomAnchorPageNumber,
        pendingZoomReanchorPage: this.pendingZoomReanchorPageNumber,
        viewportEpoch: this.viewportEpoch,
        pendingZoomTarget: this.pendingZoomTarget,
        scrollTop: el?.scrollTop ?? null,
        clientHeight: el?.clientHeight ?? null,
        scrollHeight: el?.scrollHeight ?? null,
        scrollOffset: this.virtualizer.scrollOffset(),
        virtualRange,
        virtualItemCount: items.length,
      },
    );
  }

  private waitForDom(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
