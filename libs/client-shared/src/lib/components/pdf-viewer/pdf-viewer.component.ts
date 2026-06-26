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
import { PdfViewerHandoverService } from './pdf-viewer-handover.service';
import { PdfViewerHeaderComponent } from './pdf-viewer-header/pdf-viewer-header.component';
import { PdfViewerInputService } from './pdf-viewer-input.service';
import {
  findPageAtScrollOffset,
  getBaseScale,
  getConfiguredInteger,
  getDocumentHeight,
  getDocumentWidth,
  getInitialZoom,
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
  ZOOM_SETTLE_DELAY_MS,
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
  providers: [PdfViewerService, PdfViewerInputService, PdfViewerRendererService, PdfViewerHandoverService],
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
  private readonly pdfViewerHandoverService = inject(PdfViewerHandoverService);

  private resizeObserver: ResizeObserver | null = null;
  private scrollRenderTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollAnimationFrame: number | null = null;
  private zoomAnimationFrame: number | null = null;
  private zoomSettleTimer: ReturnType<typeof setTimeout> | null = null;

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
  private programmaticScrollDepth = 0;
  private pinnedPageNumber: number | null = null;
  private pendingZoomRenderBlocked = false;
  private initialZoomLevel = 1;

  // CTRL+wheel zoom CSS-transform state.
  // During rapid zoom, only a CSS scale is applied. TanStack is not touched.
  private wheelZoomTarget: number | null = null;
  private wheelZoomBaseZoom = 1;
  private wheelZoomMouseOffsetX = 0;
  private wheelZoomMouseOffsetY = 0;
  private wheelZoomCursorOverPage = false;

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
    this.pdfViewerHandoverService.end();
    if (this.scrollRenderTimer) {
      clearTimeout(this.scrollRenderTimer);
    }
    if (this.scrollAnimationFrame !== null) {
      cancelAnimationFrame(this.scrollAnimationFrame);
    }
    if (this.zoomAnimationFrame !== null) {
      cancelAnimationFrame(this.zoomAnimationFrame);
    }
    this.cancelZoomSettleTimer();
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
    const scrollEl = this.pdfElement()?.nativeElement;
    const oldRotation = this.rotation();
    const pageDims = this.pageDimensions();
    const pageCount = this.pageCount();
    const baseScl = this.baseScale();
    const currentZoom = this.zoom();

    // Determine the anchor page and the user's position within it.
    const anchorPage = this.pinnedPageNumber ?? this.getCurrentPageFromVirtualizer();
    const scrollTop = scrollEl?.scrollTop ?? 0;
    const oldLayout = getPageLayout(anchorPage, pageCount, pageDims, baseScl, currentZoom, oldRotation);
    let anchorRatio = 0;
    if (oldLayout && oldLayout.size > 0) {
      anchorRatio = Math.max(0, Math.min(1, (scrollTop - oldLayout.start) / oldLayout.size));
    }

    // Apply rotation.
    const newRotation = (oldRotation + 90) % 360;
    this.rotation.set(newRotation);

    // Compute the target scrollTop so the same anchor page stays in view.
    const newLayout = getPageLayout(anchorPage, pageCount, pageDims, baseScl, currentZoom, newRotation);
    if (newLayout) {
      this.pendingZoomScrollTop = Math.max(0, newLayout.start + anchorRatio * newLayout.size);
    }

    // Center horizontal scrollbar after rotation.
    const containerWidth = scrollEl?.clientWidth ?? 0;
    const newContentWidth = getDocumentWidth(pageDims, containerWidth, baseScl, currentZoom, newRotation);
    const maxScrollLeft = Math.max(0, newContentWidth - containerWidth);
    this.pendingZoomScrollLeft = maxScrollLeft / 2;

    // Pin the page to maintain scroll anchoring during re-render.
    this.pinnedPageNumber = anchorPage;
    this.pendingZoomReanchorPageNumber = anchorPage;

    // Evict all rendered pages: their rotation is wrong and cannot be CSS-scaled
    // like zoom previews. Showing shimmers is better UX than wrong-orientation canvases.
    // Stay in 'normal' mode so scroll events and lazy loading continue working.
    if (scrollEl) {
      this.pdfViewerRendererService.evictAllRenderedPages(scrollEl, this.renderer);
    }

    this.viewportEpoch++;
    this.scheduleVirtualRefresh(null);
  }

  protected handleZoom(action: PdfZoomAction) {
    this.ngZone.runOutsideAngular(() => this.scheduleZoom(action));
  }

  private handleWheelZoom(accumulatedDeltaY: number, mouseClientY: number, mouseClientX: number): void {
    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) return;

    this.ngZone.runOutsideAngular(() => {
      // Compute the target zoom level.
      const current = this.wheelZoomTarget ?? this.zoom();
      const target = accumulatedDeltaY > 0 ? current - ZOOM_STEP_FINE : current + ZOOM_STEP_FINE;
      const clamped = this.normalizeZoom(target);
      if (Math.abs(clamped - (this.wheelZoomTarget ?? this.zoom())) < 0.0001) return;

      // On first tick of a zoom gesture, snapshot the base state and cursor context.
      if (this.wheelZoomTarget === null) {
        this.wheelZoomBaseZoom = this.zoom();
        this.wheelZoomCursorOverPage = this.isCursorOverPage(mouseClientX, mouseClientY, scrollEl);
        // Only cancel in-flight renders when entering zoom mode from normal.
        // When re-entering after a commit (renderMode is already 'zoom'), let the
        // render from the previous commit continue — the CSS transform provides
        // visual feedback on top while the render finishes in the background.
        if (this.renderMode !== 'zoom') {
          this.pdfViewerRendererService.prepareForZoomRender();
        }
        this.renderMode = 'zoom';
      }

      // Update cursor direction on every tick (user may switch between zoom-in/out).
      this.applyZoomCursor(scrollEl, accumulatedDeltaY < 0 ? 'in' : 'out');

      this.wheelZoomTarget = clamped;

      // Compute cursor offset relative to the scroll container viewport.
      const rect = scrollEl.getBoundingClientRect();
      let cursorOffsetY: number;
      let cursorOffsetX: number;

      if (this.wheelZoomCursorOverPage) {
        cursorOffsetY = mouseClientY - rect.top;
        cursorOffsetX = mouseClientX - rect.left;
      } else {
        // Cursor is not over a page — zoom from viewport center.
        cursorOffsetY = scrollEl.clientHeight / 2;
        cursorOffsetX = scrollEl.clientWidth / 2;
      }

      // Vertical origin: anchored to the resolved point.
      this.wheelZoomMouseOffsetY = cursorOffsetY;
      const originY = scrollEl.scrollTop + cursorOffsetY;

      // Horizontal origin: when zoom <= 1 content is centered (no overflow),
      // so use viewport center. Otherwise anchor to cursor point.
      let originX: number;
      if (clamped <= 1) {
        this.wheelZoomMouseOffsetX = scrollEl.clientWidth / 2;
        originX = scrollEl.scrollLeft + scrollEl.clientWidth / 2;
      } else {
        this.wheelZoomMouseOffsetX = cursorOffsetX;
        originX = scrollEl.scrollLeft + cursorOffsetX;
      }

      const scale = clamped / this.wheelZoomBaseZoom;

      const spacer = scrollEl.querySelector('.viewer__virtual-spacer') as HTMLElement | null;
      if (spacer) {
        spacer.style.transformOrigin = `${originX}px ${originY}px`;
        spacer.style.transform = `scale(${scale})`;
      }

      // Reset the settle timer.
      this.cancelZoomSettleTimer();
      this.zoomSettleTimer = setTimeout(() => {
        this.zoomSettleTimer = null;
        this.commitWheelZoom();
      }, ZOOM_SETTLE_DELAY_MS);
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
        target = this.initialZoomLevel;
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

    const oldZoom = this.zoom();
    const scrollEl = this.pdfElement()?.nativeElement;
    const scrollTop = this.pendingZoomScrollTop ?? scrollEl?.scrollTop ?? 0;
    const scrollLeft = this.pendingZoomScrollLeft ?? scrollEl?.scrollLeft ?? 0;

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

    // Button zoom: anchor to viewport center, except at document edges.
    if (scrollEl && pageDims.length > 0) {
      const containerWidth = scrollEl.clientWidth;
      const contentWidthOld = getDocumentWidth(pageDims, containerWidth, baseScl, oldZoom, rotation);
      const contentWidthNew = getDocumentWidth(pageDims, containerWidth, baseScl, newZoom, rotation);

      const viewportHeight = scrollEl.clientHeight;
      const oldDocHeight = getDocumentHeight(pageCount, pageDims, baseScl, oldZoom, rotation);
      const oldMaxScrollTop = Math.max(0, oldDocHeight - viewportHeight);

      if (scrollTop <= 0) {
        // At top edge: keep top of document visible.
        this.pendingZoomScrollTop = 0;
      } else if (oldMaxScrollTop > 0 && scrollTop >= oldMaxScrollTop - 1) {
        // At bottom edge: keep bottom of document visible.
        const newDocHeight = getDocumentHeight(pageCount, pageDims, baseScl, newZoom, rotation);
        this.pendingZoomScrollTop = Math.max(0, newDocHeight - viewportHeight);
      } else {
        // Center-anchored: the viewport center stays at the same relative document position.
        const viewportCenter = scrollTop + viewportHeight / 2;
        const centerPage = findPageAtScrollOffset(viewportCenter, pageCount, pageDims, baseScl, oldZoom, rotation);
        if (centerPage && centerPage.size > 0) {
          const centerRatio = (viewportCenter - centerPage.start) / centerPage.size;
          const newCenterLayout = getPageLayout(centerPage.pageNum, pageCount, pageDims, baseScl, newZoom, rotation);
          if (newCenterLayout) {
            const newCenter = newCenterLayout.start + centerRatio * newCenterLayout.size;
            this.pendingZoomScrollTop = Math.max(0, newCenter - viewportHeight / 2);
          }
        }
      }
      // Horizontal: preserve the current proportional position.
      const maxScrollLeftOld = Math.max(0, contentWidthOld - containerWidth);
      const maxScrollLeftNew = Math.max(0, contentWidthNew - containerWidth);
      const horizontalRatio = maxScrollLeftOld > 0 ? scrollLeft / maxScrollLeftOld : 0.5;
      this.pendingZoomScrollLeft = Math.max(0, horizontalRatio * maxScrollLeftNew);

      // Begin handover — reuses canvas elements positioned at the target zoom layout.
      const spacer = scrollEl.querySelector('.viewer__virtual-spacer') as HTMLElement | null;
      const virtualItems = this.virtualizer.getVirtualItems();
      const visiblePageNums = virtualItems.map((item) => item.index + 1);
      if (spacer && visiblePageNums.length > 0) {
        const viewportTop = scrollEl.scrollTop;
        const viewportBottom = viewportTop + scrollEl.clientHeight;
        const viewportPageNums = virtualItems
          .filter((item) => item.end > viewportTop && item.start < viewportBottom)
          .map((item) => item.index + 1);

        this.pdfViewerHandoverService.begin({
          spacerElement: spacer,
          scrollElement: scrollEl,
          renderer: this.renderer,
          pageDimensions: pageDims,
          pageCount,
          visiblePageNums,
          viewportPageNums,
          source: { rotation, baseScale: baseScl, zoom: oldZoom },
          target: { rotation, baseScale: baseScl, zoom: newZoom },
          getRenderedPage: (pageNum) => this.pdfViewerRendererService.getRenderedPage(pageNum),
        });
      }
    }

    this.renderMode = 'zoom';
    this.viewportEpoch++;
    this.pdfViewerRendererService.prepareForZoomRender();
    this.pendingZoomRenderBlocked = false;
    this.cancelZoomSettleTimer();
    this.scheduleVirtualRefresh(null);
  }

  /**
   * Called when CTRL+wheel zoom settles (ZOOM_SETTLE_DELAY_MS after the last tick).
   * Removes the CSS transform, commits the zoom to TanStack with the correct
   * scroll position, and triggers a full re-render.
   *
   * A handover layer with canvas clones is created in the same synchronous block
   * as the CSS-transform removal so the browser never paints a frame without
   * visible page content.
   */
  private commitWheelZoom(): void {
    const targetZoom = this.wheelZoomTarget;
    if (targetZoom === null) return;

    const baseZoom = this.wheelZoomBaseZoom;
    const mouseOffsetX = this.wheelZoomMouseOffsetX;
    const mouseOffsetY = this.wheelZoomMouseOffsetY;

    // Reset wheel zoom state.
    this.wheelZoomTarget = null;
    this.clearZoomCursor();

    const scrollEl = this.pdfElement()?.nativeElement;
    const spacer = scrollEl?.querySelector('.viewer__virtual-spacer') as HTMLElement | null;
    if (!scrollEl) return;

    // Capture visible pages while the CSS transform is still applied.
    const virtualItems = this.virtualizer.getVirtualItems();
    const visiblePageNums = virtualItems.map((item) => item.index + 1);

    // Identify pages actually in the viewport (excludes overscan) for early handover teardown.
    const viewportTop = scrollEl.scrollTop;
    const viewportBottom = viewportTop + scrollEl.clientHeight;
    const viewportPageNums = virtualItems
      .filter((item) => item.end > viewportTop && item.start < viewportBottom)
      .map((item) => item.index + 1);

    // Capture scroll positions in the OLD zoom coordinate system.
    const oldZoom = baseZoom;
    const scrollTop = scrollEl.scrollTop;
    const scrollLeft = scrollEl.scrollLeft;

    // Remove the CSS transform.
    if (spacer) {
      spacer.style.transform = '';
      spacer.style.transformOrigin = '';
    }

    if (!this.setZoom(targetZoom)) {
      this.renderMode = 'normal';
      return;
    }

    const newZoom = this.zoom();
    const pageDims = this.pageDimensions();
    const pageCount = this.pageCount();
    const baseScl = this.baseScale();
    const rotation = this.rotation();
    const containerWidth = scrollEl.clientWidth;

    // Vertical anchor — keep the document point under the cursor at the same screen Y.
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

    // Horizontal anchor — when zoom <= 1 content is centered (no overflow),
    // scrollLeft stays 0. Otherwise keep cursor point fixed.
    if (newZoom <= 1) {
      this.pendingZoomScrollLeft = 0;
    } else {
      const contentWidthOld = getDocumentWidth(pageDims, containerWidth, baseScl, oldZoom, rotation);
      const contentWidthNew = getDocumentWidth(pageDims, containerWidth, baseScl, newZoom, rotation);
      const dX = scrollLeft + mouseOffsetX - contentWidthOld / 2;
      const newScrollLeft = contentWidthNew / 2 + dX * (newZoom / oldZoom) - mouseOffsetX;
      const newMaxScrollLeft = Math.max(0, contentWidthNew - containerWidth);
      this.pendingZoomScrollLeft = Math.max(0, Math.min(newScrollLeft, newMaxScrollLeft));
    }

    // Begin handover — creates canvas clones positioned at the target zoom layout.
    // This runs in the same synchronous block as the CSS-transform removal, so the
    // browser paints the clones instead of empty slots.
    if (spacer && visiblePageNums.length > 0) {
      this.pdfViewerHandoverService.begin({
        spacerElement: spacer,
        scrollElement: scrollEl,
        renderer: this.renderer,
        pageDimensions: pageDims,
        pageCount,
        visiblePageNums,
        viewportPageNums,
        source: { rotation, baseScale: baseScl, zoom: oldZoom },
        target: { rotation, baseScale: baseScl, zoom: newZoom },
        getRenderedPage: (pageNum) => this.pdfViewerRendererService.getRenderedPage(pageNum),
      });

      // Set spacer to target dimensions immediately so scroll positions aren't
      // clamped by the browser to the old (smaller/larger) scrollable area.
      const targetWidth = getDocumentWidth(pageDims, containerWidth, baseScl, newZoom, rotation);
      const targetHeight = getDocumentHeight(pageCount, pageDims, baseScl, newZoom, rotation);
      spacer.style.width = `${targetWidth}px`;
      spacer.style.height = `${targetHeight}px`;

      // Keep signals in sync so Angular doesn't overwrite the manual DOM update.
      this.virtualContentWidth.set(targetWidth);
      this.virtualTotalSize.set(targetHeight);
    }

    // Apply computed scroll positions immediately for visual continuity.
    if (this.pendingZoomScrollTop !== null) {
      scrollEl.scrollTop = this.pendingZoomScrollTop;
    }
    if (this.pendingZoomScrollLeft !== null) {
      scrollEl.scrollLeft = this.pendingZoomScrollLeft;
    }

    // Set up anchor page for TanStack.
    const zoomAnchorPage = this.zoomAnchorPageNumber ?? this.pinnedPageNumber ?? this.getCurrentPageFromVirtualizer();
    this.zoomAnchorPageNumber = zoomAnchorPage;
    this.pendingZoomReanchorPageNumber = zoomAnchorPage;
    this.pinnedPageNumber = zoomAnchorPage;

    this.viewportEpoch++;
    this.pendingZoomRenderBlocked = false;
    this.scheduleVirtualRefresh(null);
  }

  private cancelZoomSettleTimer(): void {
    if (this.zoomSettleTimer !== null) {
      clearTimeout(this.zoomSettleTimer);
      this.zoomSettleTimer = null;
    }
  }

  private applyZoomCursor(scrollEl: HTMLElement, direction: 'in' | 'out'): void {
    scrollEl.classList.remove('viewer__page-wrapper--zoom-in', 'viewer__page-wrapper--zoom-out');
    scrollEl.classList.add(direction === 'in' ? 'viewer__page-wrapper--zoom-in' : 'viewer__page-wrapper--zoom-out');
  }

  private clearZoomCursor(): void {
    const scrollEl = this.pdfElement()?.nativeElement;
    if (scrollEl) {
      scrollEl.classList.remove('viewer__page-wrapper--zoom-in', 'viewer__page-wrapper--zoom-out');
    }
  }

  private isCursorOverPage(clientX: number, clientY: number, scrollEl: HTMLElement): boolean {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el || !scrollEl.contains(el)) return false;
    return el.closest('.canvas-wrapper') !== null || el.tagName === 'CANVAS';
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
    if (this.renderMode !== 'normal') return;
    if (this.wheelZoomTarget !== null) return;
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
    this.pdfViewerHandoverService.end();
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
    this.renderPassInFlight = false;
    this.renderPassQueued = false;
    this.pendingZoomTarget = null;
    this.zoomAnchorPageNumber = null;
    this.pendingZoomReanchorPageNumber = null;
    this.pendingZoomScrollTop = null;
    this.pendingZoomScrollLeft = null;
    this.programmaticScrollDepth = 0;
    this.pinnedPageNumber = null;
    this.pendingZoomRenderBlocked = false;
    this.wheelZoomTarget = null;
    this.cancelZoomSettleTimer();
    this.cancelScrollRenderTimer();

    if (this.scrollAnimationFrame !== null) {
      cancelAnimationFrame(this.scrollAnimationFrame);
      this.scrollAnimationFrame = null;
    }
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

      if (this.loadGeneration !== generation) {
        return;
      }

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
      if (!scrollEl) {
        return;
      }

      const containerWidth = scrollEl.getBoundingClientRect().width * PDF_RENDERING_MARGIN;
      const containerHeight = scrollEl.clientHeight;
      const newBaseScale = getBaseScale(dims, containerWidth);
      const initialZoom = getInitialZoom(dims, newBaseScale, containerHeight);
      this.initialZoomLevel = initialZoom;

      this._estimateZoom = initialZoom;
      this._estimateScale = newBaseScale;
      this._estimateRotation = 0;
      this._estimateDims = dims;

      this.baseScale.set(newBaseScale);
      this.zoom.set(initialZoom);
      this.pageDimensions.set(dims);
      this.updateVirtualContentWidth();
      this.pageCount.set(numPages);
      this.virtualizer.measure();

      this.isRendering.set(false);
      await this.waitForDom();

      if (this.loadGeneration !== generation) {
        return;
      }

      this.initializeResizeObserver();

      if (initialPage && initialPage > 1) {
        this.pendingInitialPage = initialPage;
      }

      this.pendingCanvasRefresh = true;
      this.scheduleRender();
    } catch (e) {
      // Ignore errors from stale loads — a newer loadPdf call is already in progress.
      if (this.loadGeneration !== generation) {
        return;
      }
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
        console.error('[pdf-load] renderVisiblePages FAILED:', error);
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
      // Immediately sync the total size so the spacer height is correct before
      // applying scroll positions (prevents clamping near end of document).
      const newTotalSize = this.virtualizer.getTotalSize();
      if (newTotalSize !== this.virtualTotalSize()) {
        this.virtualTotalSize.set(newTotalSize);
      }
      this.pendingVirtualMeasure = false;
      virtualSizesChanged = true;
    }

    if (this.pendingZoomReanchorPageNumber !== null) {
      const zoomAnchorPage = this.pendingZoomReanchorPageNumber;
      this.pendingZoomReanchorPageNumber = null;
      const pendingScrollTop = this.pendingZoomScrollTop;
      this.pendingZoomScrollTop = null;
      const pendingScrollLeft = this.pendingZoomScrollLeft;
      this.pendingZoomScrollLeft = null;
      if (zoomAnchorPage >= 1 && zoomAnchorPage <= this.pageCount()) {
        const scrollEl = this.pdfElement()?.nativeElement;
        if (scrollEl) {
          // Directly set the spacer dimensions on the DOM BEFORE applying scroll
          // positions. Angular's signal-based rendering hasn't processed the new
          // virtualContentWidth/virtualTotalSize yet (outside zone), so the
          // scrollable area in the DOM is still at the old size. Without this,
          // the browser would clamp scrollLeft/scrollTop to the old bounds.
          const spacer = scrollEl.querySelector('.viewer__virtual-spacer') as HTMLElement | null;
          if (spacer) {
            spacer.style.width = `${this.virtualContentWidth()}px`;
            spacer.style.height = `${this.virtualTotalSize()}px`;
          }

          // Apply both scrollTop and scrollLeft in the same synchronous block
          // so the browser never renders a frame with stale horizontal position.
          this.runProgrammaticScroll(() => {
            if (pendingScrollTop !== null) {
              scrollEl.scrollTop = pendingScrollTop;
            } else {
              this.virtualizer.scrollToIndex(zoomAnchorPage - 1, { align: 'start', behavior: 'auto' });
            }
            if (pendingScrollLeft !== null) {
              scrollEl.scrollLeft = pendingScrollLeft;
            }
          });
        }
        this.logJumpDebug('zoom-pass-scroll-to-anchor', { zoomAnchorPage, pendingScrollTop, pendingScrollLeft });
      }
    }

    if (this.pendingCanvasRefresh) {
      // Keep old bitmaps visible until replacement canvases have finished rendering.
      this.pendingCanvasRefresh = false;
    }

    // CSS-scale stale canvases BEFORE yielding to the browser. This ensures that
    // when Angular updates slot sizes (in the next rAF), the canvas wrappers
    // already have the correct visual scale — preventing a skeleton flash where
    // the old-size canvas sits in a bigger slot.
    if (this.renderMode === 'zoom') {
      const scrollEl = this.pdfElement()?.nativeElement;
      if (scrollEl) {
        this.pdfViewerRendererService.scaleAllStalePreviews(
          this.zoom(),
          this.rotation(),
          this.baseScale(),
          scrollEl,
          this.renderer,
        );
      }
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
      // Fallback: scrollLeft that wasn't consumed by the zoom-anchor block above
      // (e.g. if pendingZoomReanchorPageNumber was null).
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

    // During zoom, re-run scaleAllStalePreviews after DOM updates to reattach
    // any wrappers orphaned by Angular's @for slot recycling.
    if (this.renderMode === 'zoom') {
      const scrollEl = this.pdfElement()?.nativeElement;
      if (scrollEl) {
        this.pdfViewerRendererService.scaleAllStalePreviews(
          this.zoom(),
          this.rotation(),
          this.baseScale(),
          scrollEl,
          this.renderer,
        );
      }
    }
    if (this.renderMode !== 'normal') {
      this.pdfViewerRendererService.updateVisiblePages(items);
    }

    if (this.pendingZoomRenderBlocked) {
      // Zoom is still in progress — stale previews are visible, skip PDF.js renders
      // until the settle timer fires.
      this.releasePagePinIfIdle(items);
      return;
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
      renderMode !== 'normal' && !items.some((item) => item.pageNum === effectiveCurrentPage)
        ? (items[0]?.pageNum ?? effectiveCurrentPage)
        : effectiveCurrentPage;
    if (renderMode !== 'normal' && currentPageForRender !== effectiveCurrentPage) {
      this.logJumpDebug('transition-render-page-fallback', {
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
        renderMode !== 'normal' ? () => this.handleTransitionCurrentPageRendered(expectedZoom, renderEpoch) : undefined,
      onPageRendered: (pageNum) => {
        if (this.pdfViewerHandoverService.isActive()) {
          this.pdfViewerHandoverService.releasePage(pageNum);
        }
      },
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

  private handleTransitionCurrentPageRendered(expectedZoom: number, renderEpoch: number): void {
    if (this.renderMode === 'normal') return;
    if (Math.abs(this.zoom() - expectedZoom) >= 0.0001) return;
    if (this.viewportEpoch !== renderEpoch) return;
    if (this.pendingZoomTarget !== null || this.zoomAnimationFrame !== null) return;
    // Don't transition to normal while a new wheel zoom gesture is active —
    // the CSS transform is in flight and a commit will follow.
    if (this.wheelZoomTarget !== null || this.zoomSettleTimer !== null) return;

    this.logJumpDebug('transition-complete', {
      zoomAnchorPage: this.zoomAnchorPageNumber,
      renderMode: this.renderMode,
    });
    this.renderMode = 'normal';
    this.zoomAnchorPageNumber = null;

    // Reconcile scroll state: while renderMode was not 'normal', handleViewerScroll()
    // was a no-op — any user scrolls that occurred during zoom rendering were lost.
    // Process the current scroll position so visible pages, current page indicator,
    // and lazy loading are back in sync.
    this.processViewerScroll();
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
