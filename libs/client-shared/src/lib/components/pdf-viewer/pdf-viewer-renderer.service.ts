import { inject, Injectable, Renderer2 } from '@angular/core';
import { PageDimension } from '@asset-sg/shared/v2';
import { getPageRenderPriority, isRotationSwapped } from './pdf-viewer-layout.helper';
import {
  PDF_VIEWER_DEBUG,
  PdfRenderMode,
  PdfViewerVirtualItem,
  RenderedPage,
  RenderingPage,
} from './pdf-viewer.models';
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
  getCurrentPage: () => number;
  getRenderMode: () => PdfRenderMode;
  scheduleVirtualRefresh: () => void;
  renderMode: PdfRenderMode;
  onCurrentPageRendered?: () => void;
  onPageRendered?: (pageNum: number) => void;
}

interface RenderSlotElements {
  textLayerDiv: HTMLDivElement;
  canvas: HTMLCanvasElement;
  parentWidth: number;
  parentHeight: number;
}

@Injectable()
export class PdfViewerRendererService {
  private readonly pdfViewerService = inject(PdfViewerService);

  private readonly renderedPages = new Map<number, RenderedPage>();
  private readonly renderingPages = new Map<number, RenderingPage>();
  private latestRenderablePages = new Set<number>();
  private renderOptions: QueueVisiblePageRendersOptions | null = null;
  private readonly textLayerTimers = new Map<number, () => void>();
  private drainTimer: ReturnType<typeof setTimeout> | null = null;

  resetPages(): void {
    this.pdfViewerService.cleanupTextLayerSelections();
    this.cancelAllRenderingPages();
    this.cancelTextLayerTimers();
    this.cancelDrainTimer();
    this.renderingPages.clear();
    this.renderedPages.clear();
    this.latestRenderablePages.clear();
    this.renderOptions = null;
  }

  getRenderedPage(pageNum: number): { canvas: HTMLCanvasElement; rotation: number } | null {
    const rendered = this.renderedPages.get(pageNum);
    if (!rendered) return null;
    return { canvas: rendered.canvas, rotation: rendered.rotation };
  }

  prepareForZoomRender(): void {
    this.cancelAllRenderingPages();
    this.cancelTextLayerTimers();
    this.cancelDrainTimer();
  }

  /**
   * Evicts all rendered pages from the DOM and internal cache.
   * Used when rotation changes: old canvases are at the wrong orientation
   * and cannot be CSS-scaled (unlike zoom). Showing the shimmer skeleton
   * is better UX than displaying incorrectly-rotated content.
   */
  evictAllRenderedPages(scrollElement: HTMLDivElement, renderer: Renderer2): void {
    this.cancelAllRenderingPages();
    this.cancelTextLayerTimers();
    this.cancelDrainTimer();
    for (const pageNum of [...this.renderedPages.keys()]) {
      this.evictPage(pageNum, scrollElement, renderer);
    }
  }

  /**
   * CSS-scales all previously rendered page wrappers to match the new zoom/baseScale
   * dimensions. This keeps stale bitmaps visible at the correct visual size while
   * PDF.js re-renders at the target resolution, preventing blank flashes.
   *
   * Also reattaches any wrappers that were orphaned when TanStack Virtual recycled
   * slot elements (e.g. pages scrolling in/out of the virtual window during zoom).
   */
  scaleAllStalePreviews(
    newZoom: number,
    newRotation: number,
    newBaseScale: number,
    scrollElement: HTMLDivElement,
    renderer: Renderer2,
  ): void {
    for (const [pageNum, rendered] of this.renderedPages) {
      if (rendered.rotation !== newRotation) continue;

      const isUpToDate = rendered.zoom === newZoom && Math.abs(rendered.baseScale - newBaseScale) < BASE_SCALE_EPSILON;

      // Re-attach the wrapper if the slot was recreated by Angular's @for.
      const slot = scrollElement.querySelector(`.page-slot[data-page-num="${pageNum}"]`) as HTMLElement | null;
      if (!slot) continue;

      if (rendered.wrapper.parentNode !== slot) {
        const existing = slot.querySelector('.canvas-wrapper');
        if (existing) {
          slot.replaceChild(rendered.wrapper, existing);
        } else {
          slot.appendChild(rendered.wrapper);
        }
      }

      // Always ensure loaded class — prevents skeleton flash if Angular updated the slot.
      renderer.addClass(slot, 'page-slot--loaded');

      if (isUpToDate) {
        rendered.wrapper.style.transform = '';
        rendered.wrapper.style.transformOrigin = '';
        rendered.wrapper.classList.remove('canvas-wrapper--stale');
      } else {
        // Mark as stale — CSS handles filling the slot via absolute positioning
        // and stretching the canvas. No CSS transform needed.
        rendered.wrapper.classList.add('canvas-wrapper--stale');
        rendered.wrapper.style.transform = '';
        rendered.wrapper.style.transformOrigin = '';
      }
    }
  }

  /**
   * Lightweight scroll-frame handler: updates the visible page set so that
   * the `.finally()` cascade in `drainSlots()` picks the right pages.
   */
  updateVisiblePages(items: PdfViewerVirtualItem[]): void {
    this.latestRenderablePages = new Set(items.map((item) => item.index + 1));
  }

  evictPagesOutside(items: PdfViewerVirtualItem[], scrollElement: HTMLDivElement, renderer: Renderer2): void {
    const visiblePages = new Set(items.map((item) => item.index + 1));
    for (const pageNum of this.renderedPages.keys()) {
      if (!visiblePages.has(pageNum)) {
        this.evictPage(pageNum, scrollElement, renderer);
      }
    }
  }

  private scheduleTextLayerIfNeeded(options: QueueVisiblePageRendersOptions): void {
    if (options.renderMode !== 'normal') return;
    for (const pageNum of this.latestRenderablePages) {
      const rendered = this.renderedPages.get(pageNum);
      if (
        rendered &&
        !rendered.textLayerRendered &&
        rendered.page &&
        rendered.viewport &&
        this.isPageRenderedWithCurrentParams(pageNum, options.expectedZoom, options.expectedRotation, options.baseScale)
      ) {
        this.scheduleTextLayerRender(pageNum, rendered);
      }
    }
  }

  queueVisiblePageRenders(options: QueueVisiblePageRendersOptions): void {
    const { items } = options;

    this.renderOptions = options;

    if (items.length === 0) {
      this.latestRenderablePages.clear();
      return;
    }

    this.latestRenderablePages = new Set(items.map((item) => item.index + 1));

    // Handle text layer for already-rendered visible pages.
    const currentPage = options.getCurrentPage();
    this.scheduleTextLayerIfNeeded(options);

    // Handle transition callback if current page is already rendered.
    if (options.renderMode !== 'normal') {
      const rendered = this.renderedPages.get(currentPage);
      if (
        rendered &&
        this.isPageRenderedWithCurrentParams(
          currentPage,
          options.expectedZoom,
          options.expectedRotation,
          options.baseScale,
        )
      ) {
        options.onCurrentPageRendered?.();
        return;
      }
    }

    if (PDF_VIEWER_DEBUG) {
      console.log(
        `%c[pdf-queue] %cqueueVisiblePageRenders: ${this.latestRenderablePages.size} visible pages, currentPage=${currentPage}, mode=${options.renderMode}`,
        'background: #336699; color: white; padding: 4px; border-radius: 4px;',
        'font-weight: bold;',
      );
    }

    this.drainSlots();
  }

  /**
   * Fills available concurrency slots by computing the best candidates on the fly.
   * Called after every render completion (via `.finally()`) and after `queueVisiblePageRenders()`.
   *
   * Instead of popping from a stored queue, it:
   * 1. Takes `latestRenderablePages` (the ~13 pages TanStack Virtual currently shows)
   * 2. Filters out pages already rendered or rendering with current params
   * 3. Sorts by distance to `getCurrentPage()` — computed fresh every time
   * 4. Dispatches the top entries to fill concurrency slots
   */
  private drainSlots(): void {
    const options = this.renderOptions;
    if (!options) return;

    const renderMode = options.getRenderMode();
    const maxConcurrent = renderMode !== 'normal' ? 1 : options.maxConcurrentPageLoads;
    const currentZoom = options.getZoom();
    const currentRotation = options.getRotation();
    const currentPage = options.getCurrentPage();

    // Build candidate list: visible pages that are not yet rendered or rendering with matching params.
    const candidates: number[] = [];
    for (const pageNum of this.latestRenderablePages) {
      if (this.isPageRenderedWithCurrentParams(pageNum, currentZoom, currentRotation, options.baseScale)) continue;
      if (this.isPageRenderingWithCurrentParams(pageNum, currentZoom, currentRotation, options.baseScale)) continue;
      candidates.push(pageNum);
    }

    // In zoom mode, restrict to only the current page.
    const filtered = this.filterCandidatesForMode(candidates, renderMode, currentPage);

    // Sort by dynamic priority: current page first, then nearest neighbors.
    filtered.sort((a, b) => getPageRenderPriority(a, currentPage) - getPageRenderPriority(b, currentPage));

    // Dispatch to fill slots.
    for (const pageNum of filtered) {
      if (this.renderingPages.size >= maxConcurrent) break;

      const priority = getPageRenderPriority(pageNum, currentPage);
      if (PDF_VIEWER_DEBUG) {
        console.log(
          `[pdf-queue] dispatch render page=${pageNum} priority=${priority} active=${this.renderingPages.size + 1}/${maxConcurrent}`,
        );
      }
      this.dispatchRender(pageNum, currentZoom, currentRotation, options);
    }
  }

  private filterCandidatesForMode(candidates: number[], renderMode: PdfRenderMode, currentPage: number): number[] {
    if (renderMode === 'normal') return candidates;
    const idx = candidates.indexOf(currentPage);
    return idx === -1 ? [] : [candidates[idx]];
  }

  private dispatchRender(
    pageNum: number,
    zoom: number,
    rotation: number,
    options: QueueVisiblePageRendersOptions,
  ): void {
    const renderEpoch = options.getViewportEpoch();
    void this.renderPageSlot(pageNum, zoom, rotation, renderEpoch, options).finally(() => {
      // Deferred to a macrotask so that early-bail renders (where the promise
      // resolves synchronously as a microtask) don't create an infinite
      // microtask chain that locks the browser. Multiple .finally() callbacks
      // coalesce into a single drain call.
      this.scheduleDrain();
    });
  }

  /**
   * Schedules a single coalesced `drainSlots()` call via `setTimeout(0)`.
   * Multiple `.finally()` callbacks that fire in the same tick collapse
   * into one drain, and the macrotask boundary prevents infinite loops
   * when `renderPageSlot` bails before its first `await`.
   */
  private scheduleDrain(): void {
    if (this.drainTimer !== null) return;
    this.drainTimer = setTimeout(() => {
      this.drainTimer = null;
      this.drainSlots();
    }, 0);
  }

  private cancelDrainTimer(): void {
    if (this.drainTimer !== null) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }
  }

  private isPageRenderedWithCurrentParams(pageNum: number, zoom: number, rotation: number, baseScale: number): boolean {
    const rendered = this.renderedPages.get(pageNum);
    return (
      !!rendered &&
      rendered.zoom === zoom &&
      rendered.rotation === rotation &&
      Math.abs(rendered.baseScale - baseScale) < BASE_SCALE_EPSILON
    );
  }

  private isPageRenderingWithCurrentParams(
    pageNum: number,
    zoom: number,
    rotation: number,
    baseScale: number,
  ): boolean {
    const rendering = this.renderingPages.get(pageNum);
    return (
      !!rendering &&
      rendering.zoom === zoom &&
      rendering.rotation === rotation &&
      Math.abs(rendering.baseScale - baseScale) < BASE_SCALE_EPSILON
    );
  }

  private async renderPageSlot(
    pageNum: number,
    zoomAtStart: number,
    rotationAtStart: number,
    renderEpoch: number,
    options: QueueVisiblePageRendersOptions,
  ): Promise<void> {
    if (this.isPageAlreadyUpToDate(pageNum, renderEpoch, zoomAtStart, rotationAtStart, options)) return;

    // Register in renderingPages so that renderingPages.size reflects the true
    // concurrency count. This runs synchronously before the first await, so
    // drainSlots sees the correct count when it dispatches the next entry.
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

    if (!slotElement) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      options.scheduleVirtualRefresh();
      return;
    }
    if (!dim) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      return;
    }
    if (renderEpoch !== options.getViewportEpoch()) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      return;
    }

    const isSwapped = isRotationSwapped(rotationAtStart);
    const parentWidth = (isSwapped ? dim.height : dim.width) * options.baseScale;
    const parentHeight = (isSwapped ? dim.width : dim.height) * options.baseScale;

    // While we wait for the fresh PDF.js render, scale the existing stale canvas
    // wrapper to roughly match the new slot dimensions. This eliminates the blank
    // flash during zoom changes without requiring a separate snapshot cache.
    this.scaleStalePreview(pageNum, zoomAtStart, rotationAtStart, options.baseScale);

    const canvas = options.renderer.createElement('canvas') as HTMLCanvasElement;
    const textLayerDiv = options.renderer.createElement('div') as HTMLDivElement;
    options.renderer.addClass(textLayerDiv, 'textLayer');

    const wrapper = options.renderer.createElement('div') as HTMLDivElement;
    options.renderer.addClass(wrapper, 'canvas-wrapper');
    options.renderer.appendChild(wrapper, canvas);
    options.renderer.appendChild(wrapper, textLayerDiv);

    const elements: RenderSlotElements = { textLayerDiv, canvas, parentWidth, parentHeight };
    const pageResult = await this.tryExecuteRender(
      pageNum,
      renderEpoch,
      zoomAtStart,
      rotationAtStart,
      elements,
      options,
    );
    if (pageResult === null) return;

    this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
    if (this.cleanupIfStaleAfterRender(renderEpoch, zoomAtStart, rotationAtStart, textLayerDiv, options)) return;

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
    this.notifyPageRendered(pageNum, rendered, options);
  }

  /** Returns `true` when the page is already drawn (or already rendering) with the current params. */
  private isPageAlreadyUpToDate(
    pageNum: number,
    renderEpoch: number,
    zoomAtStart: number,
    rotationAtStart: number,
    options: QueueVisiblePageRendersOptions,
  ): boolean {
    const existingRendered = this.renderedPages.get(pageNum);
    if (
      existingRendered?.zoom === zoomAtStart &&
      existingRendered?.rotation === rotationAtStart &&
      Math.abs(existingRendered?.baseScale - options.baseScale) < BASE_SCALE_EPSILON
    ) {
      options.onPageRendered?.(pageNum);
      if (!existingRendered.textLayerRendered && existingRendered.page && existingRendered.viewport) {
        this.scheduleTextLayerRender(pageNum, existingRendered);
      }
      if (options.renderMode !== 'normal' && pageNum === options.currentPage) {
        options.onCurrentPageRendered?.();
      }
      return true;
    }

    const rendering = this.renderingPages.get(pageNum);
    if (
      rendering?.epoch === renderEpoch &&
      rendering.zoom === zoomAtStart &&
      rendering.rotation === rotationAtStart &&
      Math.abs(rendering.baseScale - options.baseScale) < BASE_SCALE_EPSILON
    ) {
      return true;
    }

    return false;
  }

  /**
   * Runs the actual PDF.js render inside a try/catch.
   * Returns the page result on success, or `null` when the render was cancelled or stale
   * (in which case `finishPageRender` and `cleanupTextLayerSelection` are already called).
   */
  private async tryExecuteRender(
    pageNum: number,
    renderEpoch: number,
    zoomAtStart: number,
    rotationAtStart: number,
    { textLayerDiv, canvas, parentWidth, parentHeight }: RenderSlotElements,
    options: QueueVisiblePageRendersOptions,
  ) {
    try {
      if (renderEpoch !== options.getViewportEpoch()) {
        this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
        this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
        return null;
      }
      return await this.pdfViewerService.renderPageToCanvas(
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
            Math.abs(currentRendering.baseScale - options.baseScale) < BASE_SCALE_EPSILON &&
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
      return null;
    }
  }

  /**
   * Checks whether the render result is outdated after the async canvas paint.
   * Cleans up the text-layer element and, where appropriate, schedules a virtual refresh.
   * Returns `true` if the result should be discarded.
   */
  private cleanupIfStaleAfterRender(
    renderEpoch: number,
    zoomAtStart: number,
    rotationAtStart: number,
    textLayerDiv: HTMLDivElement,
    options: QueueVisiblePageRendersOptions,
  ): boolean {
    if (options.getLoadGeneration() !== options.loadGeneration) {
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      return true;
    }
    if (renderEpoch !== options.getViewportEpoch()) {
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      return true;
    }
    if (options.getZoom() !== zoomAtStart || options.getRotation() !== rotationAtStart) {
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      options.scheduleVirtualRefresh();
      return true;
    }
    return false;
  }

  /** Fires the post-render callback or schedules the text-layer for visible pages. */
  private notifyPageRendered(pageNum: number, rendered: RenderedPage, options: QueueVisiblePageRendersOptions): void {
    options.onPageRendered?.(pageNum);
    if (options.renderMode !== 'normal') {
      if (pageNum === options.currentPage) {
        options.onCurrentPageRendered?.();
      }
    } else {
      this.scheduleTextLayerRender(pageNum, rendered);
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

    // Mark the incoming wrapper so CSS can play a short fade-in.
    rendered.wrapper.classList.add('canvas-wrapper--appearing');

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

  /**
   * Scales the existing stale canvas wrapper to visually match the upcoming
   * render's dimensions so it acts as an in-place placeholder while PDF.js
   * re-renders at the new zoom/baseScale level.
   *
   * Only applied when the rotation is unchanged; a rotated canvas would appear
   * in the wrong orientation and look worse than the shimmer.
   */
  private scaleStalePreview(pageNum: number, newZoom: number, newRotation: number, newBaseScale: number): void {
    const existing = this.renderedPages.get(pageNum);
    if (!existing) return;
    if (existing.rotation !== newRotation) return;

    const isUpToDate = existing.zoom === newZoom && Math.abs(existing.baseScale - newBaseScale) < BASE_SCALE_EPSILON;
    if (isUpToDate) return;

    existing.wrapper.classList.add('canvas-wrapper--stale');
    existing.wrapper.style.transform = '';
    existing.wrapper.style.transformOrigin = '';
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
  }
}
