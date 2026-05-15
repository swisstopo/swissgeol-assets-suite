import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
import { AssetFile, AssetFileSignedUrl, PageDimension } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { VirtualItem, injectVirtualizer } from '@tanstack/angular-virtual';
import { firstValueFrom } from 'rxjs';
import { showAlert } from '../../state/alert/alert.actions';
import { AlertType } from '../../state/alert/alert.model';
import { triggerDownload } from '../../utils';
import { PdfViewerHeaderComponent } from './pdf-viewer-header/pdf-viewer-header.component';
import {
  PdfNavigationAction,
  PdfViewerNavigationComponent,
} from './pdf-viewer-navigation/pdf-viewer-navigation.component';
import { PdfViewerRotateComponent } from './pdf-viewer-rotate/pdf-viewer-rotate.component';
import { PdfViewerTocComponent } from './pdf-viewer-toc/pdf-viewer-toc.component';
import { PdfViewerZoomComponent, PdfZoomAction } from './pdf-viewer-zoom/pdf-viewer-zoom.component';
import { PdfViewerService } from './pdf-viewer.service';

export type PdfViewerFile = Pick<AssetFile, 'id' | 'pageRangeClassifications'> & {
  fileName: string;
};

interface RenderedPage {
  wrapper: HTMLDivElement;
  canvas: HTMLCanvasElement;
  textLayerDiv: HTMLDivElement;
  zoom: number;
  rotation: number;
}

interface RenderingPage {
  epoch: number;
  zoom: number;
  rotation: number;
}

interface ScrollAnchor {
  pageNum: number;
  ratio: number;
  align?: 'start';
}

// Fit rendered pages slightly inside the available viewer width.
const PDF_RENDERING_MARGIN = 0.95;
// Zoom bounds and button step size.
const MAX_ZOOM_LEVEL = 5;
const MIN_ZOOM_LEVEL = 1;
const ZOOM_STEP = 0.5;
// Virtual document spacing used by TanStack Virtual and manual scroll anchoring.
const VIRTUAL_PADDING = 8;
const VIRTUAL_GAP = 8;
// Default number of pages kept in the virtual range before/after the viewport.
const DEFAULT_OVERSCAN = 4;
// Default maximum number of PDF.js page render tasks allowed at the same time.
const DEFAULT_MAX_CONCURRENT_PAGE_LOADS = 2;
// Debounce for non-scroll render refreshes such as zoom, rotation, resize, and initial load.
const RENDER_REFRESH_DELAY_MS = 60;
// Delay expensive page rendering only while the active page is changing quickly.
const CURRENT_PAGE_CHANGE_RENDER_DELAY_MS = 120;
// Defers work until Angular has flushed the virtual page-slot DOM updates.
const DOM_RENDER_SETTLE_DELAY_MS = 0;

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
  providers: [PdfViewerService],
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
  public readonly overscan = input(DEFAULT_OVERSCAN, { transform: numberAttribute });
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
  protected readonly virtualItems = signal<VirtualItem[]>([]);
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
  private readonly httpClient = inject(HttpClient);
  private readonly ngZone = inject(NgZone);

  private resizeObserver: ResizeObserver | null = null;
  private inputCleanup: (() => void) | null = null;
  private panDragCleanup: (() => void) | null = null;
  private renderDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentPageChangeRenderTimer: ReturnType<typeof setTimeout> | null = null;

  private renderPassInFlight = false;
  private renderPassQueued = false;
  private pendingVirtualMeasure = false;
  private pendingCanvasRefresh = false;
  private pendingAnchor: ScrollAnchor | null = null;
  private pendingHorizontalScrollRatio: number | null = null;
  private viewportEpoch = 0;

  private renderedPages = new Map<number, RenderedPage>();
  private renderingPages = new Map<number, RenderingPage>();
  private renderQueue: number[] = [];
  private renderQueueEpoch = 0;
  private renderQueueZoom = 1;
  private renderQueueRotation = 0;
  private activePageRenderCount = 0;
  private latestRenderablePages = new Set<number>();
  private loadGeneration = 0;

  private isSpacePressed = false;
  private panDragActive = false;
  private panLastX = 0;
  private panLastY = 0;
  private panPointerId: number | null = null;

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
      const isSwapped = this._estimateRotation === 90 || this._estimateRotation === 270;
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
    this.inputCleanup?.();
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }
    if (this.currentPageChangeRenderTimer) {
      clearTimeout(this.currentPageChangeRenderTimer);
    }
    this.clearRenderQueue();
    this.finishPanDrag();
  }

  protected onViewerMouseDown(event: MouseEvent) {
    this.startPanDrag(event);
  }

  protected onViewerPointerDown(event: PointerEvent) {
    this.startPanDrag(event);
  }

  onSpaceDown(event: KeyboardEvent) {
    if (this.isEditableTarget(event.target)) {
      return;
    }
    if (this.isSpacePressed && event.repeat) {
      event.preventDefault();
      return;
    }
    this.isSpacePressed = true;
    this.setDragMode(true);
    event.preventDefault();
  }

  onSpaceUp() {
    this.isSpacePressed = false;
    this.setDragMode(false);
  }

  onWindowBlur() {
    this.isSpacePressed = false;
    this.setDragMode(false);
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
    const activePage = this.currentPage() > 0 ? this.currentPage() : 1;
    this.rotation.update((value) => (value + 90) % 360);
    this.scheduleVirtualRefresh({ pageNum: activePage, ratio: 0, align: 'start' }, this.captureHorizontalScrollRatio());
  }

  protected handleZoom(action: PdfZoomAction) {
    const anchor = this.captureViewportAnchor();
    const current = this.zoom();
    let target = current;
    switch (action) {
      case 'in':
        target = current + ZOOM_STEP;
        break;
      case 'out':
        target = current - ZOOM_STEP;
        break;
      case 'reset':
        target = 1;
        break;
    }

    if (!this.setZoom(target)) return;
    this.scheduleVirtualRefresh(anchor, 0.5);
  }

  protected onCloseViewer() {
    this.closeViewer();
  }

  protected downloadPdf() {
    this.httpClient
      .get<AssetFileSignedUrl>(`/api/assets/${this.assetId()}/files/${this.selectedPdf()?.id}/presigned?download=true`)
      .subscribe(({ url }) => {
        triggerDownload(url, true);
      });
  }

  private setupInputHandlers(): void {
    this.inputCleanup?.();
    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) {
      return;
    }

    const onScroll = () => {
      if (this.pageCount() === 0) return;
      this.viewportEpoch++;
      if (this.renderDebounceTimer) {
        clearTimeout(this.renderDebounceTimer);
        this.renderDebounceTimer = null;
      }
      const previousPage = this.currentPage();
      const items = this.syncVirtualViewport();
      this.updateCurrentPage(items);
      this.latestRenderablePages = new Set(items.map((item) => item.index + 1));
      this.clearRenderQueue();
      this.evictPagesOutside(items);
      if (this.currentPage() !== previousPage) {
        this.scheduleCurrentPageChangeRender();
      } else if (!this.currentPageChangeRenderTimer) {
        this.runRenderPass();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (this.isSpaceKey(event)) {
        this.onSpaceDown(event);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (this.isSpaceKey(event)) {
        this.onSpaceUp();
      }
    };
    const onBlur = () => {
      this.onWindowBlur();
    };
    this.ngZone.runOutsideAngular(() => {
      scrollEl.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('keyup', onKeyUp, true);
      window.addEventListener('blur', onBlur, true);
    });

    this.inputCleanup = () => {
      scrollEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur, true);
      this.finishPanDrag();
    };
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
    this.renderingPages.clear();
    this.renderedPages.clear();
    this.clearRenderQueue();
    this.finishPanDrag();

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
    this.pendingAnchor = null;
    this.pendingHorizontalScrollRatio = null;

    this._estimateZoom = 1;
    this._estimateScale = 1;
    this._estimateRotation = 0;
    this._estimateDims = [];

    const generation = ++this.loadGeneration;

    try {
      const [numPages, metadata] = await Promise.all([
        this.pdfViewerService.loadPdf(this.assetId(), pdfId),
        this.fetchMetadata(this.assetId(), pdfId),
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

      const maxNativeWidth = Math.max(1, ...dims.map((d) => d.width));
      const containerWidth = scrollEl.getBoundingClientRect().width * PDF_RENDERING_MARGIN;
      const newBaseScale = containerWidth / maxNativeWidth;

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
        this.scrollToPage(initialPage, 'auto');
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

  private async fetchMetadata(
    assetId: number,
    pdfId: number,
  ): Promise<{ pageCount: number; pageDimensions: PageDimension[] }> {
    return firstValueFrom(
      this.httpClient.get<{ pageCount: number; pageDimensions: PageDimension[] }>(
        `/api/assets/${assetId}/files/${pdfId}/metadata`,
      ),
    );
  }

  private initializeResizeObserver() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        const el = this.pdfElement()?.nativeElement;
        if (!el) return;

        const dims = this.pageDimensions();
        if (dims.length === 0) return;

        const maxNativeWidth = Math.max(1, ...dims.map((d) => d.width));
        const containerWidth = el.getBoundingClientRect().width * PDF_RENDERING_MARGIN;
        const nextScale = containerWidth / maxNativeWidth;
        if (Math.abs(nextScale - this.baseScale()) < 0.0001) return;

        const anchor = this.captureViewportAnchor();
        const horizontalRatio = this.captureHorizontalScrollRatio();
        this.baseScale.set(nextScale);
        this.scheduleVirtualRefresh(anchor, horizontalRatio);
      });
    });

    const el = this.pdfElement()?.nativeElement;
    if (el) {
      this.resizeObserver.observe(el);
    }
  }

  private scheduleVirtualRefresh(anchor: ScrollAnchor | null = null, horizontalRatio: number | null = null) {
    if (anchor) {
      this.pendingAnchor = anchor;
    }
    if (horizontalRatio !== null) {
      this.pendingHorizontalScrollRatio = horizontalRatio;
    }
    this.pendingVirtualMeasure = true;
    this.pendingCanvasRefresh = true;
    this.scheduleRender();
  }

  private scheduleRender() {
    this.ngZone.runOutsideAngular(() => {
      if (this.renderDebounceTimer) return;
      this.renderDebounceTimer = setTimeout(() => {
        this.renderDebounceTimer = null;
        this.runRenderPass();
      }, RENDER_REFRESH_DELAY_MS);
    });
  }

  private scheduleCurrentPageChangeRender() {
    this.ngZone.runOutsideAngular(() => {
      if (this.currentPageChangeRenderTimer) {
        clearTimeout(this.currentPageChangeRenderTimer);
      }
      this.currentPageChangeRenderTimer = setTimeout(() => {
        this.currentPageChangeRenderTimer = null;
        this.runRenderPass();
      }, CURRENT_PAGE_CHANGE_RENDER_DELAY_MS);
    });
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
    if (this.pendingVirtualMeasure) {
      this.syncEstimateFields();
      this.updateVirtualContentWidth();
      this.virtualizer.measure();
      this.pendingVirtualMeasure = false;
    }

    if (this.pendingCanvasRefresh) {
      this.clearRenderedPages();
      this.pendingCanvasRefresh = false;
    }

    let items = this.syncVirtualViewport();
    this.updateCurrentPage(items);

    await this.waitForDom();

    if (this.pendingAnchor) {
      this.applyScrollAnchor(this.pendingAnchor);
      this.pendingAnchor = null;
    }
    if (this.pendingHorizontalScrollRatio !== null) {
      this.applyHorizontalScrollRatio(this.pendingHorizontalScrollRatio);
      this.pendingHorizontalScrollRatio = null;
    }

    items = this.syncVirtualViewport();
    this.updateCurrentPage(items);
    const renderEpoch = ++this.viewportEpoch;

    this.evictPagesOutside(items);

    const expectedZoom = this.zoom();
    const expectedRotation = this.rotation();
    this.queueVisiblePageRenders(items, expectedZoom, expectedRotation, renderEpoch);
  }

  private syncVirtualViewport(): VirtualItem[] {
    const items = this.virtualizer.getVirtualItems();
    this.virtualItems.set(items);
    this.virtualTotalSize.set(this.virtualizer.getTotalSize());
    return items;
  }

  private evictPagesOutside(items: VirtualItem[]): void {
    const visiblePages = new Set(items.map((item) => item.index + 1));
    for (const pageNum of [...this.renderedPages.keys()]) {
      if (!visiblePages.has(pageNum)) {
        this.evictPage(pageNum);
      }
    }
  }

  private queueVisiblePageRenders(
    items: VirtualItem[],
    expectedZoom: number,
    expectedRotation: number,
    renderEpoch: number,
  ): void {
    if (items.length === 0) {
      this.latestRenderablePages.clear();
      this.clearRenderQueue();
      return;
    }

    const current = this.currentPage() > 0 ? this.currentPage() : items[0]!.index + 1;
    const pages = items
      .map((item) => item.index + 1)
      .sort((a, b) => this.getPageRenderPriority(a, current) - this.getPageRenderPriority(b, current));

    this.latestRenderablePages = new Set(pages);
    this.clearRenderQueue();
    this.renderQueueEpoch = renderEpoch;
    this.renderQueueZoom = expectedZoom;
    this.renderQueueRotation = expectedRotation;

    for (const pageNum of pages) {
      const rendered = this.renderedPages.get(pageNum);
      const rendering = this.renderingPages.get(pageNum);
      if (rendered?.zoom === expectedZoom && rendered.rotation === expectedRotation) continue;
      if (
        rendering?.epoch === renderEpoch &&
        rendering.zoom === expectedZoom &&
        rendering.rotation === expectedRotation
      ) {
        continue;
      }

      this.renderQueue.push(pageNum);
    }

    if (this.renderQueue.length > 0) {
      console.log('[PdfViewer] queued pages for render', {
        currentPage: current,
        pages: this.renderQueue,
        maxConcurrent: this.getConfiguredMaxConcurrentPageLoads(),
      });
    }
    this.processRenderQueue();
  }

  private clearRenderQueue(): void {
    this.renderQueue = [];
  }

  private processRenderQueue(): void {
    const epoch = this.renderQueueEpoch;
    const zoom = this.renderQueueZoom;
    const rotation = this.renderQueueRotation;

    if (epoch !== this.viewportEpoch) return;

    while (this.activePageRenderCount < this.getConfiguredMaxConcurrentPageLoads() && this.renderQueue.length > 0) {
      const pageNum = this.renderQueue.shift()!;
      if (!this.latestRenderablePages.has(pageNum)) continue;
      this.activePageRenderCount++;
      console.log('[PdfViewer] fetching/rendering page', {
        pageIndex: pageNum - 1,
        pageNum,
        activePageRenders: this.activePageRenderCount,
        queuedPages: this.renderQueue,
      });
      void this.renderPageSlot(pageNum, zoom, rotation, epoch).finally(() => {
        this.activePageRenderCount = Math.max(0, this.activePageRenderCount - 1);
        this.processRenderQueue();
      });
    }
  }

  private getPageRenderPriority(pageNum: number, currentPage: number): number {
    if (pageNum === currentPage) return 0;
    if (pageNum === currentPage + 1) return 1;
    if (pageNum === currentPage - 1) return 2;
    return Math.abs(pageNum - currentPage) * 2 + (pageNum > currentPage ? 0 : 1);
  }

  private async renderPageSlot(pageNum: number, zoomAtStart: number, rotationAtStart: number, renderEpoch: number) {
    const rendering = this.renderingPages.get(pageNum);
    if (rendering?.epoch === renderEpoch && rendering.zoom === zoomAtStart && rendering.rotation === rotationAtStart) {
      return;
    }

    this.renderingPages.set(pageNum, { epoch: renderEpoch, zoom: zoomAtStart, rotation: rotationAtStart });
    if (renderEpoch !== this.viewportEpoch) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      return;
    }

    const generation = this.loadGeneration;

    const slotElement = this.pdfElement()?.nativeElement.querySelector(
      `.page-slot[data-page-num="${pageNum}"]`,
    ) as HTMLElement | null;
    const dim = this.pageDimensions()[pageNum - 1];

    if (!slotElement || !dim) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      return;
    }
    if (renderEpoch !== this.viewportEpoch) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      return;
    }
    this.renderer.removeClass(slotElement, 'page-slot--loaded');

    const isSwapped = rotationAtStart === 90 || rotationAtStart === 270;
    const parentWidth = (isSwapped ? dim.height : dim.width) * this.baseScale();
    const parentHeight = (isSwapped ? dim.width : dim.height) * this.baseScale();

    const canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
    const textLayerDiv = this.renderer.createElement('div') as HTMLDivElement;
    this.renderer.addClass(textLayerDiv, 'textLayer');

    try {
      if (renderEpoch !== this.viewportEpoch) {
        console.log('[PdfViewer] skipped stale page before fetch', { pageIndex: pageNum - 1, pageNum });
        this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
        return;
      }
      await this.pdfViewerService.renderPageToCanvas(
        canvas,
        textLayerDiv,
        pageNum,
        parentWidth,
        parentHeight,
        zoomAtStart,
        rotationAtStart,
      );
      console.log('[PdfViewer] fetched/rendered page canvas', { pageIndex: pageNum - 1, pageNum });
    } catch (error) {
      console.error(`Failed to render page ${pageNum}`, error);
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      return;
    }

    this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);

    if (this.loadGeneration !== generation) return;
    if (renderEpoch !== this.viewportEpoch) {
      console.log('[PdfViewer] discarded stale rendered page', { pageIndex: pageNum - 1, pageNum });
      return;
    }
    if (this.zoom() !== zoomAtStart || this.rotation() !== rotationAtStart) {
      this.scheduleVirtualRefresh();
      return;
    }

    const currentSlot = this.pdfElement()?.nativeElement.querySelector(
      `.page-slot[data-page-num="${pageNum}"]`,
    ) as HTMLElement | null;
    if (!currentSlot || currentSlot !== slotElement) return;

    const wrapper = this.renderer.createElement('div') as HTMLDivElement;
    this.renderer.addClass(wrapper, 'canvas-wrapper');
    this.renderer.appendChild(wrapper, canvas);
    this.renderer.appendChild(wrapper, textLayerDiv);

    while (slotElement.firstChild) {
      this.renderer.removeChild(slotElement, slotElement.firstChild);
    }
    this.renderer.appendChild(slotElement, wrapper);
    this.renderer.addClass(slotElement, 'page-slot--loaded');

    this.renderedPages.set(pageNum, { wrapper, canvas, textLayerDiv, zoom: zoomAtStart, rotation: rotationAtStart });
    console.log('[PdfViewer] loaded page into viewer', { pageIndex: pageNum - 1, pageNum });
  }

  private finishPageRender(pageNum: number, epoch: number, zoom: number, rotation: number): void {
    const rendering = this.renderingPages.get(pageNum);
    if (rendering?.epoch === epoch && rendering.zoom === zoom && rendering.rotation === rotation) {
      this.renderingPages.delete(pageNum);
    }
  }

  private evictPage(pageNum: number) {
    const rendered = this.renderedPages.get(pageNum);
    if (!rendered) return;

    const slotElement = this.pdfElement()?.nativeElement.querySelector(
      `.page-slot[data-page-num="${pageNum}"]`,
    ) as HTMLElement | null;
    if (slotElement && rendered.wrapper.parentNode === slotElement) {
      this.renderer.removeChild(slotElement, rendered.wrapper);
      this.renderer.removeClass(slotElement, 'page-slot--loaded');
    }

    this.renderedPages.delete(pageNum);
    this.renderingPages.delete(pageNum);
  }

  private clearRenderedPages() {
    this.clearRenderQueue();
    const scrollEl = this.pdfElement()?.nativeElement;
    for (const [pageNum, rendered] of this.renderedPages) {
      const slot = scrollEl?.querySelector(`.page-slot[data-page-num="${pageNum}"]`);
      if (slot && rendered.wrapper.parentNode === slot) {
        this.renderer.removeChild(slot, rendered.wrapper);
        this.renderer.removeClass(slot, 'page-slot--loaded');
      }
    }
    this.renderedPages.clear();
  }

  private updateCurrentPage(items: VirtualItem[]) {
    if (items.length === 0) return;
    const el = this.pdfElement()?.nativeElement;
    if (!el) return;

    const viewportCenter = el.scrollTop + el.clientHeight / 2;
    let closest = items[0]!;
    let distance = Infinity;

    for (const item of items) {
      const itemCenter = (item.start + item.end) / 2;
      const itemDistance = Math.abs(itemCenter - viewportCenter);
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

  private scrollToPage(pageNum: number, behavior: ScrollBehavior = 'smooth') {
    this.virtualizer.scrollToIndex(pageNum - 1, { align: 'start', behavior });
    if (behavior === 'smooth') {
      this.scheduleCurrentPageChangeRender();
    } else {
      this.scheduleRender();
    }
  }

  private captureViewportAnchor(): ScrollAnchor | null {
    const el = this.pdfElement()?.nativeElement;
    if (!el || this.pageCount() <= 0) return null;

    const pageNum = this.currentPage() > 0 ? this.currentPage() : 1;
    const layout = this.getPageLayout(pageNum);
    if (!layout || layout.size <= 0) return null;

    const viewportCenter = el.scrollTop + el.clientHeight / 2;
    const ratio = this.clamp((viewportCenter - layout.start) / layout.size, 0, 1);
    return { pageNum, ratio };
  }

  private applyScrollAnchor(anchor: ScrollAnchor): void {
    const el = this.pdfElement()?.nativeElement;
    if (!el) return;

    const layout = this.getPageLayout(anchor.pageNum);
    if (!layout || layout.size <= 0) return;

    const totalHeight = this.getDocumentHeight();
    const maxScrollTop = Math.max(0, totalHeight - el.clientHeight);
    if (anchor.align === 'start') {
      el.scrollTop = this.clamp(layout.start, 0, maxScrollTop);
      return;
    }

    const desiredCenter = layout.start + anchor.ratio * layout.size;
    el.scrollTop = this.clamp(desiredCenter - el.clientHeight / 2, 0, maxScrollTop);
  }

  private getPageLayout(pageNum: number): { start: number; size: number } | null {
    const count = this.pageCount();
    if (pageNum < 1 || pageNum > count) return null;

    const size = this.getPageHeight(pageNum);
    let start = VIRTUAL_PADDING;
    for (let i = 1; i < pageNum; i++) {
      start += this.getPageHeight(i) + VIRTUAL_GAP;
    }
    return { start, size };
  }

  private getDocumentHeight(): number {
    const count = this.pageCount();
    if (count <= 0) return 0;

    let total = VIRTUAL_PADDING * 2;
    for (let i = 1; i <= count; i++) {
      total += this.getPageHeight(i);
    }
    total += VIRTUAL_GAP * Math.max(0, count - 1);
    return total;
  }

  private getPageHeight(pageNum: number): number {
    const dim = this.pageDimensions()[pageNum - 1];
    if (!dim) return 300;
    const isSwapped = this.rotation() === 90 || this.rotation() === 270;
    const nativeHeight = isSwapped ? dim.width : dim.height;
    return Math.round(nativeHeight * this.baseScale() * this.zoom());
  }

  protected getPageWidth(pageNum: number): number {
    const dim = this.pageDimensions()[pageNum - 1];
    if (!dim) return 300;
    const isSwapped = this.rotation() === 90 || this.rotation() === 270;
    const nativeWidth = isSwapped ? dim.height : dim.width;
    return Math.round(nativeWidth * this.baseScale() * this.zoom());
  }

  private getDocumentWidth(): number {
    const dims = this.pageDimensions();
    const containerWidth = this.pdfElement()?.nativeElement.clientWidth ?? 0;
    if (dims.length === 0) return containerWidth;

    const isSwapped = this.rotation() === 90 || this.rotation() === 270;
    const maxNativeWidth = Math.max(...dims.map((d) => (isSwapped ? d.height : d.width)));
    const contentWidth = maxNativeWidth * this.baseScale() * this.zoom();
    return Math.max(containerWidth, Math.ceil(contentWidth));
  }

  private updateVirtualContentWidth(): void {
    this.virtualContentWidth.set(this.getDocumentWidth());
  }

  private getConfiguredOverscan(): number {
    const value = this.overscan();
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : DEFAULT_OVERSCAN;
  }

  private getConfiguredMaxConcurrentPageLoads(): number {
    const value = this.maxConcurrentPageLoads();
    return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : DEFAULT_MAX_CONCURRENT_PAGE_LOADS;
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
    el.scrollLeft = this.clamp(ratio, 0, 1) * maxScrollLeft;
  }

  private syncEstimateFields() {
    this._estimateZoom = this.zoom();
    this._estimateScale = this.baseScale();
    this._estimateRotation = this.rotation();
    this._estimateDims = this.pageDimensions();
  }

  private setZoom(target: number): boolean {
    const clamped = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, target));
    if (Math.abs(clamped - this.zoom()) < 0.0001) return false;
    this.zoom.set(Math.round(clamped * 1000) / 1000);
    return true;
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
  }

  private isSpaceKey(event: KeyboardEvent): boolean {
    return event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';
  }

  private startPanDrag(event: MouseEvent | PointerEvent): void {
    if (this.panDragActive || !this.isSpacePressed || event.button !== 0) return;

    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) return;

    this.panDragActive = true;
    this.panLastX = event.clientX;
    this.panLastY = event.clientY;
    this.panPointerId = 'pointerId' in event ? event.pointerId : null;
    if (this.panPointerId !== null) {
      try {
        scrollEl.setPointerCapture(this.panPointerId);
      } catch {
        // The pointer can already be released if the browser cancelled the drag start.
      }
    }
    this.isPanning.set(true);
    this.panDragCleanup?.();
    this.panDragCleanup = this.ngZone.runOutsideAngular(() => {
      const removePointerMove = this.renderer.listen('window', 'pointermove', (moveEvent: PointerEvent) => {
        if (this.panPointerId === null || moveEvent.pointerId === this.panPointerId) this.updatePanDrag(moveEvent);
      });
      const removeMouseMove = this.renderer.listen('window', 'mousemove', (moveEvent: MouseEvent) => {
        this.updatePanDrag(moveEvent);
      });
      const removePointerUp = this.renderer.listen('window', 'pointerup', (upEvent: PointerEvent) => {
        if (this.panPointerId === null || upEvent.pointerId === this.panPointerId) this.finishPanDrag();
      });
      const removeMouseUp = this.renderer.listen('window', 'mouseup', () => {
        this.finishPanDrag();
      });
      const removePointerCancel = this.renderer.listen('window', 'pointercancel', (cancelEvent: PointerEvent) => {
        if (this.panPointerId === null || cancelEvent.pointerId === this.panPointerId) this.finishPanDrag();
      });
      const removeDragStart = this.renderer.listen('window', 'dragstart', (dragEvent: DragEvent) => {
        dragEvent.preventDefault();
      });
      const removeSelectStart = this.renderer.listen('window', 'selectstart', (selectEvent: Event) => {
        selectEvent.preventDefault();
      });
      return () => {
        removePointerMove();
        removeMouseMove();
        removePointerUp();
        removeMouseUp();
        removePointerCancel();
        removeDragStart();
        removeSelectStart();
      };
    });
    event.preventDefault();
  }

  private updatePanDrag(event: MouseEvent | PointerEvent): void {
    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) {
      this.finishPanDrag();
      return;
    }

    const dx = event.clientX - this.panLastX;
    const dy = event.clientY - this.panLastY;
    this.panLastX = event.clientX;
    this.panLastY = event.clientY;

    if (dx !== 0) scrollEl.scrollLeft -= dx;
    if (dy !== 0) scrollEl.scrollTop -= dy;
    event.preventDefault();
  }

  private setDragMode(enabled: boolean): void {
    this.isSpacePanMode.set(enabled);
    if (!enabled) {
      this.finishPanDrag();
    }
  }

  private finishPanDrag(): void {
    const scrollEl = this.pdfElement()?.nativeElement;
    if (scrollEl && this.panPointerId !== null) {
      try {
        scrollEl.releasePointerCapture(this.panPointerId);
      } catch {
        // Ignore release errors for pointers the browser already cleaned up.
      }
    }
    this.panDragActive = false;
    this.panPointerId = null;
    this.isPanning.set(false);
    this.panDragCleanup?.();
    this.panDragCleanup = null;
  }

  private waitForDom(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, DOM_RENDER_SETTLE_DELAY_MS));
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
