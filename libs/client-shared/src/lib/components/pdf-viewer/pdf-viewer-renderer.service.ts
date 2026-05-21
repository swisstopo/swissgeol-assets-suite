import { inject, Injectable, Renderer2 } from '@angular/core';
import { PageDimension } from '@asset-sg/shared/v2';
import { getPageRenderPriority, isRotationSwapped } from './pdf-viewer-layout.helper';
import { PdfRenderMode, PdfViewerVirtualItem, RenderedPage, RenderingPage } from './pdf-viewer.models';
import { PdfViewerService } from './pdf-viewer.service';

const BASE_SCALE_EPSILON = 0.0001;

interface QueueVisiblePageRendersOptions {
  items: PdfViewerVirtualItem[];
  currentPage: number;
  expectedZoom: number;
  expectedRotation: number;
  maxConcurrentPageLoads: number;
  scrollElement: HTMLDivElement;
  renderer: Renderer2;
  pageDimensions: PageDimension[];
  baseScale: number;
  loadGeneration: number;
  getViewportEpoch: () => number;
  getLoadGeneration: () => number;
  getZoom: () => number;
  getRotation: () => number;
  scheduleVirtualRefresh: () => void;
  renderMode: PdfRenderMode;
  onCurrentPageRendered?: () => void;
  onSettleRenderComplete?: () => void;
}

/**
 * A pending render request held in the priority queue. Entries survive scroll events:
 * they are inserted/updated/dropped incrementally rather than the queue being rebuilt
 * on every viewport change. This is what stops in-flight renders for still-visible
 * pages from being cancelled and re-fetched on scroll.
 */
interface QueueEntry {
  pageNum: number;
  /** Lower is rendered sooner; computed from `getPageRenderPriority(pageNum, currentPage)`. */
  priority: number;
  /** Render parameters captured at queue time; used to detect stale entries. */
  zoom: number;
  rotation: number;
  baseScale: number;
}

@Injectable()
export class PdfViewerRendererService {
  private readonly pdfViewerService = inject(PdfViewerService);

  private renderedPages = new Map<number, RenderedPage>();
  private readonly renderingPages = new Map<number, RenderingPage>();
  private readonly renderQueue = new Map<number, QueueEntry>();
  private activePageRenderCount = 0;
  private latestRenderablePages = new Set<number>();
  private renderOptions: QueueVisiblePageRendersOptions | null = null;
  private readonly textLayerTimers = new Map<number, () => void>();
  private lastLoggedCurrentPage: number | null = null;
  private reprioritizationSection = 0;
  /** Page number currently occupying the fast-lane slot, or null if idle. */
  private fastLanePageNum: number | null = null;

  resetPages(): void {
    this.pdfViewerService.cleanupTextLayerSelections();
    this.cancelFastLane();
    this.cancelAllRenderingPages();
    this.cancelTextLayerTimers();
    this.renderingPages.clear();
    this.renderedPages.clear();
    this.latestRenderablePages.clear();
    this.renderOptions = null;
    this.lastLoggedCurrentPage = null;
    this.reprioritizationSection = 0;
    this.clearRenderQueue();
  }

  clearRenderQueue(): void {
    this.renderQueue.clear();
  }

  prepareForZoomRender(): void {
    this.clearRenderQueue();
    this.cancelAllRenderingPages();
    this.cancelFastLane();
    this.cancelTextLayerTimers();
  }

  setLatestRenderablePages(items: PdfViewerVirtualItem[]): void {
    this.latestRenderablePages = new Set(items.map((item) => item.index + 1));
  }

  evictPagesOutside(items: PdfViewerVirtualItem[], scrollElement: HTMLDivElement, renderer: Renderer2): void {
    const visiblePages = new Set(items.map((item) => item.index + 1));
    for (const pageNum of this.renderingPages.keys()) {
      if (!visiblePages.has(pageNum)) {
        this.cancelRenderingPage(pageNum);
      }
    }
    for (const pageNum of this.renderQueue.keys()) {
      if (!visiblePages.has(pageNum)) {
        this.renderQueue.delete(pageNum);
      }
    }
    for (const pageNum of this.renderedPages.keys()) {
      if (!visiblePages.has(pageNum)) {
        this.evictPage(pageNum, scrollElement, renderer);
      }
    }
  }

  clearRenderedPages(scrollElement: HTMLDivElement | undefined, renderer: Renderer2): void {
    this.clearRenderQueue();
    this.cancelAllRenderingPages();
    this.cancelTextLayerTimers();
    for (const [pageNum, rendered] of this.renderedPages) {
      const slot = scrollElement?.querySelector(`.page-slot[data-page-num="${pageNum}"]`);
      this.pdfViewerService.cleanupTextLayerSelection(rendered.textLayerDiv);
      if (slot && rendered.wrapper.parentNode === slot) {
        renderer.removeChild(slot, rendered.wrapper);
        renderer.removeClass(slot, 'page-slot--loaded');
      }
    }
    this.renderedPages.clear();
  }

  queueVisiblePageRenders(options: QueueVisiblePageRendersOptions): void {
    const { items, expectedZoom, expectedRotation } = options;
    const expectedBaseScale = options.baseScale;

    if (items.length === 0) {
      this.latestRenderablePages.clear();
      this.clearRenderQueue();
      this.renderOptions = options;
      return;
    }

    const firstItem = items[0];
    if (!firstItem) return;

    const current = options.currentPage > 0 ? options.currentPage : firstItem.index + 1;

    // In zoom mode we only ever want to draw the current page; everything else is held
    // back until the post-zoom 'settle' pass to keep CPU/network low while zooming.
    let visiblePageNums: number[];
    if (options.renderMode === 'zoom') {
      const itemsContainCurrent = items.some((item) => item.index + 1 === current);
      visiblePageNums = itemsContainCurrent ? [current] : [firstItem.index + 1];
    } else {
      visiblePageNums = items.map((item) => item.index + 1);
    }
    const visiblePageSet = new Set(visiblePageNums);

    this.renderOptions = options;
    this.latestRenderablePages = visiblePageSet;

    const paramsMatch = (zoom: number, rotation: number, baseScale: number): boolean =>
      zoom === expectedZoom &&
      rotation === expectedRotation &&
      Math.abs(baseScale - expectedBaseScale) < BASE_SCALE_EPSILON;

    // 1. Drop queue entries that are no longer visible OR whose params went stale.
    for (const [pageNum, entry] of this.renderQueue) {
      if (!visiblePageSet.has(pageNum) || !paramsMatch(entry.zoom, entry.rotation, entry.baseScale)) {
        this.renderQueue.delete(pageNum);
      }
    }

    // 2. Cancel in-flight renders that are no longer visible OR whose params went stale.
    //    Crucially, an in-flight render whose params still match a still-visible page is
    //    left running — this is what prevents duplicate byte-range fetches on scroll.
    for (const [pageNum, rendering] of this.renderingPages) {
      if (!visiblePageSet.has(pageNum) || !paramsMatch(rendering.zoom, rendering.rotation, rendering.baseScale)) {
        this.cancelRenderingPage(pageNum);
      }
    }

    // 3. For each visible page, ensure it is either already rendered, already rendering
    //    with matching params, or queued with current params + priority.
    for (const pageNum of visiblePageNums) {
      const priority = getPageRenderPriority(pageNum, current);

      const rendered = this.renderedPages.get(pageNum);
      if (rendered && paramsMatch(rendered.zoom, rendered.rotation, rendered.baseScale)) {
        const needsTextLayer =
          options.renderMode !== 'zoom' &&
          pageNum === current &&
          !rendered.textLayerRendered &&
          !!rendered.page &&
          !!rendered.viewport;
        if (needsTextLayer) {
          // Run renderPageSlot once so the text layer can be scheduled.
          this.upsertQueueEntry(pageNum, priority, expectedZoom, expectedRotation, expectedBaseScale);
        } else {
          // Already drawn correctly and nothing else to do; make sure no pending entry lingers.
          this.renderQueue.delete(pageNum);
        }
        if (options.renderMode === 'zoom' && pageNum === current) {
          options.onCurrentPageRendered?.();
        }
        continue;
      }

      const rendering = this.renderingPages.get(pageNum);
      if (rendering && paramsMatch(rendering.zoom, rendering.rotation, rendering.baseScale)) {
        // Render is already running for the right params: keep it and remove any duplicate
        // queue entry. No cancel, no requeue — this is the no-op scroll path.
        this.renderQueue.delete(pageNum);
        continue;
      }

      // Either not rendering yet or rendering with stale params (and just cancelled above).
      this.upsertQueueEntry(pageNum, priority, expectedZoom, expectedRotation, expectedBaseScale);
    }

    // 4. Refresh priorities for any retained entries against the (possibly new) current page.
    for (const entry of this.renderQueue.values()) {
      entry.priority = getPageRenderPriority(entry.pageNum, current);
    }

    // 5. If the active page changed, cancel any fast-lane render for the previous page.
    if (this.fastLanePageNum !== null && this.fastLanePageNum !== current) {
      console.log(`[pdf-queue] fast-lane cancelled for page=${this.fastLanePageNum} (active page → ${current})`);
      this.cancelRenderingPage(this.fastLanePageNum);
      this.fastLanePageNum = null;
    }

    if (this.lastLoggedCurrentPage !== current) {
      this.lastLoggedCurrentPage = current;
      this.logReprioritizationSection(current, options.renderMode);
    }

    this.processRenderQueue();
  }

  private logReprioritizationSection(currentPage: number, renderMode: PdfRenderMode): void {
    this.reprioritizationSection++;
    const prioritizedLabels = this.getPrioritizedPageLabels(20);
    console.groupCollapsed(
      `[pdf-queue][section ${this.reprioritizationSection}] active page changed to ${currentPage} (${renderMode})`,
    );
    console.log(
      `[pdf-queue] next prioritized pages: ${prioritizedLabels.length > 0 ? prioritizedLabels.join(', ') : 'none'}`,
    );
    console.groupEnd();
  }

  private getPrioritizedPageLabels(limit: number): string[] {
    const queued = [...this.renderQueue.values()].sort((a, b) => a.priority - b.priority);
    const queuedPageSet = new Set(queued.map((entry) => entry.pageNum));
    const inFlightPages = [...this.renderingPages.keys()];
    const labels = queued.map((entry) =>
      this.renderingPages.has(entry.pageNum) ? `${entry.pageNum}(in-flight)` : `${entry.pageNum}`,
    );

    for (const pageNum of inFlightPages) {
      if (!queuedPageSet.has(pageNum)) {
        labels.push(`${pageNum}(in-flight)`);
      }
    }

    return labels.slice(0, limit);
  }

  private upsertQueueEntry(pageNum: number, priority: number, zoom: number, rotation: number, baseScale: number): void {
    const existing = this.renderQueue.get(pageNum);
    if (existing) {
      existing.priority = priority;
      existing.zoom = zoom;
      existing.rotation = rotation;
      existing.baseScale = baseScale;
      return;
    }
    this.renderQueue.set(pageNum, { pageNum, priority, zoom, rotation, baseScale });
  }

  /**
   * Linear scan over queue entries returning (and removing) the entry with the smallest
   * priority. With ~10–20 visible pages this is cheap and avoids rebuilding/sorting an
   * array on every scroll tick.
   */
  private popHighestPriority(): QueueEntry | undefined {
    let best: QueueEntry | undefined;
    for (const entry of this.renderQueue.values()) {
      if (!best || entry.priority < best.priority) {
        best = entry;
      }
    }
    if (!best) return undefined;
    this.renderQueue.delete(best.pageNum);
    return best;
  }

  private processRenderQueue(): void {
    const options = this.renderOptions;
    if (!options) return;

    const maxConcurrentPageLoads =
      options.renderMode === 'zoom' || options.renderMode === 'settle' ? 1 : options.maxConcurrentPageLoads;

    // --- Normal queue dispatch ---
    while (this.activePageRenderCount < maxConcurrentPageLoads && this.renderQueue.size > 0) {
      const entry = this.popHighestPriority();
      if (!entry) break;
      if (!this.latestRenderablePages.has(entry.pageNum)) continue;

      if (entry.zoom !== options.getZoom() || entry.rotation !== options.getRotation()) {
        continue;
      }

      console.log(
        `[pdf-queue] dispatch render page=${entry.pageNum} priority=${entry.priority} active=${this.activePageRenderCount + 1}/${maxConcurrentPageLoads}`,
      );
      this.activePageRenderCount++;
      const renderEpoch = options.getViewportEpoch();
      void this.renderPageSlot(entry.pageNum, entry.zoom, entry.rotation, renderEpoch, options).finally(() => {
        this.activePageRenderCount = Math.max(0, this.activePageRenderCount - 1);
        this.processRenderQueue();
        this.maybeCompleteSettle();
      });
    }

    // --- Fast-lane: current page gets one extra slot when normal slots are full ---
    if (
      options.renderMode === 'normal' &&
      this.activePageRenderCount >= maxConcurrentPageLoads &&
      this.fastLanePageNum === null
    ) {
      const currentPageEntry = this.renderQueue.get(options.currentPage);
      const isCurrentPageInFlight = this.renderingPages.has(options.currentPage);
      if (currentPageEntry && !isCurrentPageInFlight) {
        this.renderQueue.delete(options.currentPage);
        if (
          this.latestRenderablePages.has(currentPageEntry.pageNum) &&
          currentPageEntry.zoom === options.getZoom() &&
          currentPageEntry.rotation === options.getRotation()
        ) {
          this.fastLanePageNum = currentPageEntry.pageNum;
          console.log(
            `[pdf-queue] fast-lane dispatch page=${currentPageEntry.pageNum} active=${this.activePageRenderCount + 1}/${maxConcurrentPageLoads}+1`,
          );
          this.activePageRenderCount++;
          const renderEpoch = options.getViewportEpoch();
          void this.renderPageSlot(
            currentPageEntry.pageNum,
            currentPageEntry.zoom,
            currentPageEntry.rotation,
            renderEpoch,
            options,
          ).finally(() => {
            this.activePageRenderCount = Math.max(0, this.activePageRenderCount - 1);
            if (this.fastLanePageNum === currentPageEntry.pageNum) {
              this.fastLanePageNum = null;
            }
            this.processRenderQueue();
            this.maybeCompleteSettle();
          });
        }
      }
    }

    this.maybeCompleteSettle();
  }

  private maybeCompleteSettle(): void {
    const options = this.renderOptions;
    if (!options || options.renderMode !== 'settle') return;
    if (this.renderQueue.size > 0 || this.activePageRenderCount > 0) return;
    options.onSettleRenderComplete?.();
  }

  private async renderPageSlot(
    pageNum: number,
    zoomAtStart: number,
    rotationAtStart: number,
    renderEpoch: number,
    options: QueueVisiblePageRendersOptions,
  ): Promise<void> {
    const existingRendered = this.renderedPages.get(pageNum);
    if (
      existingRendered &&
      existingRendered.zoom === zoomAtStart &&
      existingRendered.rotation === rotationAtStart &&
      Math.abs(existingRendered.baseScale - options.baseScale) < 0.0001
    ) {
      if (
        pageNum === options.currentPage &&
        !existingRendered.textLayerRendered &&
        existingRendered.page &&
        existingRendered.viewport
      ) {
        this.scheduleTextLayerRender(pageNum, existingRendered);
      }
      if (options.renderMode === 'zoom' && pageNum === options.currentPage) {
        options.onCurrentPageRendered?.();
      }
      return;
    }

    const rendering = this.renderingPages.get(pageNum);
    if (
      rendering?.epoch === renderEpoch &&
      rendering.zoom === zoomAtStart &&
      rendering.rotation === rotationAtStart &&
      Math.abs(rendering.baseScale - options.baseScale) < 0.0001
    ) {
      return;
    }

    this.renderingPages.set(pageNum, {
      epoch: renderEpoch,
      zoom: zoomAtStart,
      rotation: rotationAtStart,
      baseScale: options.baseScale,
    });
    if (renderEpoch !== options.getViewportEpoch()) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      return;
    }

    const slotElement = options.scrollElement.querySelector(
      `.page-slot[data-page-num="${pageNum}"]`,
    ) as HTMLElement | null;
    const dim = options.pageDimensions[pageNum - 1];

    if (!slotElement || !dim) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      if (!slotElement) {
        options.scheduleVirtualRefresh();
      }
      return;
    }
    if (renderEpoch !== options.getViewportEpoch()) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      return;
    }

    const isSwapped = isRotationSwapped(rotationAtStart);
    const parentWidth = (isSwapped ? dim.height : dim.width) * options.baseScale;
    const parentHeight = (isSwapped ? dim.width : dim.height) * options.baseScale;

    const canvas = options.renderer.createElement('canvas') as HTMLCanvasElement;
    const textLayerDiv = options.renderer.createElement('div') as HTMLDivElement;
    options.renderer.addClass(textLayerDiv, 'textLayer');

    const wrapper = options.renderer.createElement('div') as HTMLDivElement;
    options.renderer.addClass(wrapper, 'canvas-wrapper');
    options.renderer.appendChild(wrapper, canvas);
    options.renderer.appendChild(wrapper, textLayerDiv);

    let pageResult;
    try {
      if (renderEpoch !== options.getViewportEpoch()) {
        this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
        this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
        return;
      }
      pageResult = await this.pdfViewerService.renderPageToCanvas(
        canvas,
        pageNum,
        parentWidth,
        parentHeight,
        zoomAtStart,
        rotationAtStart,
        (renderTask) => {
          const currentRendering = this.renderingPages.get(pageNum);
          if (
            currentRendering?.epoch === renderEpoch &&
            currentRendering.zoom === zoomAtStart &&
            currentRendering.rotation === rotationAtStart &&
            Math.abs(currentRendering.baseScale - options.baseScale) < 0.0001 &&
            !currentRendering.cancelled
          ) {
            currentRendering.renderTask = renderTask;
          } else {
            renderTask.cancel();
          }
        },
      );
    } catch (error) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      if (!this.isRenderCancelled(error)) {
        console.error(`Failed to render page ${pageNum}`, error);
      }
      return;
    }

    this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);

    if (options.getLoadGeneration() !== options.loadGeneration) {
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      return;
    }
    if (renderEpoch !== options.getViewportEpoch()) {
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      return;
    }
    if (options.getZoom() !== zoomAtStart || options.getRotation() !== rotationAtStart) {
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      options.scheduleVirtualRefresh();
      return;
    }

    const currentSlot = options.scrollElement.querySelector(
      `.page-slot[data-page-num="${pageNum}"]`,
    ) as HTMLElement | null;
    if (!currentSlot || currentSlot !== slotElement) {
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      return;
    }

    const rendered: RenderedPage = {
      wrapper,
      canvas,
      textLayerDiv,
      zoom: zoomAtStart,
      rotation: rotationAtStart,
      baseScale: options.baseScale,
      textLayerRendered: false,
      page: pageResult.page,
      viewport: pageResult.viewport,
    };
    this.swapRenderedPage(pageNum, rendered, slotElement, options.renderer);

    if (pageNum === options.currentPage) {
      if (options.renderMode === 'zoom') {
        options.onCurrentPageRendered?.();
      } else {
        this.scheduleTextLayerRender(pageNum, rendered);
      }
    }
  }

  private finishPageRender(pageNum: number, epoch: number, zoom: number, rotation: number): void {
    const rendering = this.renderingPages.get(pageNum);
    if (rendering?.epoch === epoch && rendering.zoom === zoom && rendering.rotation === rotation) {
      this.renderingPages.delete(pageNum);
    }
  }

  private swapRenderedPage(
    pageNum: number,
    rendered: RenderedPage,
    slotElement: HTMLElement,
    renderer: Renderer2,
  ): void {
    const previous = this.renderedPages.get(pageNum);
    if (previous && previous !== rendered) {
      this.disposeRenderedPage(pageNum, previous);
    }

    if (rendered.wrapper.parentNode === slotElement) {
      // Already in the DOM — class may already be set; skip the DOM read (classList.contains)
      // to avoid forcing a style recalculation.
      renderer.addClass(slotElement, 'page-slot--loaded');
      this.renderedPages.set(pageNum, rendered);
      return;
    }

    const existingWrapper = slotElement.querySelector('.canvas-wrapper');
    if (existingWrapper) {
      slotElement.replaceChild(rendered.wrapper, existingWrapper);
    } else {
      slotElement.appendChild(rendered.wrapper);
    }
    renderer.addClass(slotElement, 'page-slot--loaded');
    this.renderedPages.set(pageNum, rendered);
  }

  private disposeRenderedPage(pageNum: number, rendered: RenderedPage): void {
    this.cancelTextLayerTimer(pageNum);
    this.pdfViewerService.cleanupTextLayerSelection(rendered.textLayerDiv);
  }

  private scheduleTextLayerRender(pageNum: number, rendered: RenderedPage): void {
    if (rendered.textLayerRendered || !rendered.page || !rendered.viewport) return;

    this.cancelTextLayerTimer(pageNum);
    rendered.textLayerRendered = true;
    const page = rendered.page;
    const viewport = rendered.viewport;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const frameId = requestAnimationFrame(() => {
      timeoutId = setTimeout(() => {
        this.textLayerTimers.delete(pageNum);
        if (this.renderedPages.get(pageNum) !== rendered) {
          rendered.textLayerRendered = false;
          return;
        }
        this.pdfViewerService.renderTextLayer(page, rendered.textLayerDiv, viewport).catch((error) => {
          console.error(`Failed to render text layer for page ${pageNum}`, error);
          rendered.textLayerRendered = false;
        });
      }, 0);
    });

    this.textLayerTimers.set(pageNum, () => {
      cancelAnimationFrame(frameId);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      rendered.textLayerRendered = false;
    });
  }

  private cancelTextLayerTimer(pageNum: number): void {
    this.textLayerTimers.get(pageNum)?.();
    this.textLayerTimers.delete(pageNum);
  }

  private cancelTextLayerTimers(): void {
    for (const cancel of this.textLayerTimers.values()) {
      cancel();
    }
    this.textLayerTimers.clear();
  }

  private cancelRenderingPage(pageNum: number): void {
    const rendering = this.renderingPages.get(pageNum);
    if (!rendering) return;
    rendering.cancelled = true;
    rendering.renderTask?.cancel();
    this.renderingPages.delete(pageNum);
  }

  private cancelAllRenderingPages(): void {
    for (const pageNum of this.renderingPages.keys()) {
      this.cancelRenderingPage(pageNum);
    }
  }

  private isRenderCancelled(error: unknown): boolean {
    return error instanceof Error && error.name === 'RenderingCancelledException';
  }

  private evictPage(pageNum: number, scrollElement: HTMLDivElement, renderer: Renderer2): void {
    const rendered = this.renderedPages.get(pageNum);
    if (!rendered) return;

    const slotElement = scrollElement.querySelector(`.page-slot[data-page-num="${pageNum}"]`) as HTMLElement | null;
    this.cancelTextLayerTimer(pageNum);
    this.disposeRenderedPage(pageNum, rendered);
    if (slotElement && rendered.wrapper.parentNode === slotElement) {
      rendered.wrapper.remove();
      renderer.removeClass(slotElement, 'page-slot--loaded');
    }

    this.renderedPages.delete(pageNum);
    this.renderingPages.delete(pageNum);
  }

  private cancelFastLane(): void {
    if (this.fastLanePageNum !== null) {
      this.cancelRenderingPage(this.fastLanePageNum);
      this.fastLanePageNum = null;
    }
  }
}
