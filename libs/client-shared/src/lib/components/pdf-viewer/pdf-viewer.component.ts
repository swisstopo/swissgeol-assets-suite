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
import { AssetFileSignedUrl, PageDimension } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { VirtualItem, injectVirtualizer } from '@tanstack/angular-virtual';
import { firstValueFrom } from 'rxjs';
import { showAlert } from '../../state/alert/alert.actions';
import { AlertType } from '../../state/alert/alert.model';
import { triggerDownload } from '../../utils';
import { PdfViewerHeaderComponent } from './pdf-viewer-header/pdf-viewer-header.component';
import { PdfViewerInputService } from './pdf-viewer-input.service';
import {
  getBaseScale,
  getConfiguredInteger,
  getDocumentHeight,
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
  DOM_RENDER_SETTLE_DELAY_MS,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  PDF_RENDERING_MARGIN,
  PdfViewerFile,
  RENDER_REFRESH_DELAY_MS,
  ScrollAnchor,
  VIRTUAL_GAP,
  VIRTUAL_PADDING,
  ZOOM_STEP,
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
  private readonly pdfViewerInputService = inject(PdfViewerInputService);
  private readonly pdfViewerRendererService = inject(PdfViewerRendererService);

  private resizeObserver: ResizeObserver | null = null;
  private renderDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentPageChangeRenderTimer: ReturnType<typeof setTimeout> | null = null;

  private renderPassInFlight = false;
  private renderPassQueued = false;
  private pendingVirtualMeasure = false;
  private pendingCanvasRefresh = false;
  private pendingAnchor: ScrollAnchor | null = null;
  private pendingHorizontalScrollRatio: number | null = null;
  private viewportEpoch = 0;

  private loadGeneration = 0;

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
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }
    if (this.currentPageChangeRenderTimer) {
      clearTimeout(this.currentPageChangeRenderTimer);
    }
    this.pdfViewerRendererService.clearRenderQueue();
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
    });
  }

  private handleViewerScroll(): void {
    if (this.pageCount() === 0) return;
    this.viewportEpoch++;
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
      this.renderDebounceTimer = null;
    }
    const previousPage = this.currentPage();
    const items = this.syncVirtualViewport();
    this.updateCurrentPage(items);
    this.pdfViewerRendererService.setLatestRenderablePages(items);
    this.pdfViewerRendererService.clearRenderQueue();
    this.evictPagesOutside(items);
    if (this.currentPage() !== previousPage) {
      this.scheduleCurrentPageChangeRender();
    } else if (!this.currentPageChangeRenderTimer) {
      this.runRenderPass();
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

        const containerWidth = el.getBoundingClientRect().width * PDF_RENDERING_MARGIN;
        const nextScale = getBaseScale(dims, containerWidth);
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
      this.pdfViewerRendererService.clearRenderedPages(this.pdfElement()?.nativeElement, this.renderer);
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
    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) return;

    this.pdfViewerRendererService.evictPagesOutside(items, scrollEl, this.renderer);
  }

  private queueVisiblePageRenders(
    items: VirtualItem[],
    expectedZoom: number,
    expectedRotation: number,
    renderEpoch: number,
  ): void {
    if (items.length === 0) {
      this.pdfViewerRendererService.setLatestRenderablePages(items);
      this.pdfViewerRendererService.clearRenderQueue();
      return;
    }

    const scrollEl = this.pdfElement()?.nativeElement;
    if (!scrollEl) return;

    this.pdfViewerRendererService.queueVisiblePageRenders({
      items,
      currentPage: this.currentPage(),
      expectedZoom,
      expectedRotation,
      renderEpoch,
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
      scheduleVirtualRefresh: () => this.scheduleVirtualRefresh(),
    });
  }

  private updateCurrentPage(items: VirtualItem[]) {
    if (items.length === 0) return;
    const el = this.pdfElement()?.nativeElement;
    if (!el) return;

    const viewportCenter = el.scrollTop + el.clientHeight / 2;
    const firstItem = items[0];
    if (!firstItem) return;

    let closest = firstItem;
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
    return getPageLayout(
      pageNum,
      this.pageCount(),
      this.pageDimensions(),
      this.baseScale(),
      this.zoom(),
      this.rotation(),
    );
  }

  private getDocumentHeight(): number {
    return getDocumentHeight(this.pageCount(), this.pageDimensions(), this.baseScale(), this.zoom(), this.rotation());
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

  private waitForDom(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, DOM_RENDER_SETTLE_DELAY_MS));
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
