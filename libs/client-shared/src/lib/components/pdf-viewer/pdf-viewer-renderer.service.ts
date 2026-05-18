import { inject, Injectable, Renderer2 } from '@angular/core';
import { PageDimension } from '@asset-sg/shared/v2';
import { getPageRenderPriority, isRotationSwapped } from './pdf-viewer-layout.helper';
import { PdfViewerVirtualItem, RenderedPage, RenderingPage } from './pdf-viewer.models';
import { PdfViewerService } from './pdf-viewer.service';

interface QueueVisiblePageRendersOptions {
  items: PdfViewerVirtualItem[];
  currentPage: number;
  expectedZoom: number;
  expectedRotation: number;
  renderEpoch: number;
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
}

@Injectable()
export class PdfViewerRendererService {
  private readonly pdfViewerService = inject(PdfViewerService);

  private renderedPages = new Map<number, RenderedPage>();
  private renderingPages = new Map<number, RenderingPage>();
  private renderQueue: number[] = [];
  private renderQueueEpoch = 0;
  private renderQueueZoom = 1;
  private renderQueueRotation = 0;
  private activePageRenderCount = 0;
  private latestRenderablePages = new Set<number>();
  private renderOptions: QueueVisiblePageRendersOptions | null = null;

  resetPages(): void {
    this.pdfViewerService.cleanupTextLayerSelections();
    this.renderingPages.clear();
    this.renderedPages.clear();
    this.latestRenderablePages.clear();
    this.renderOptions = null;
    this.clearRenderQueue();
  }

  clearRenderQueue(): void {
    this.renderQueue = [];
  }

  setLatestRenderablePages(items: PdfViewerVirtualItem[]): void {
    this.latestRenderablePages = new Set(items.map((item) => item.index + 1));
  }

  evictPagesOutside(items: PdfViewerVirtualItem[], scrollElement: HTMLDivElement, renderer: Renderer2): void {
    const visiblePages = new Set(items.map((item) => item.index + 1));
    for (const pageNum of [...this.renderedPages.keys()]) {
      if (!visiblePages.has(pageNum)) {
        this.evictPage(pageNum, scrollElement, renderer);
      }
    }
  }

  clearRenderedPages(scrollElement: HTMLDivElement | undefined, renderer: Renderer2): void {
    this.clearRenderQueue();
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
    const { items, expectedZoom, expectedRotation, renderEpoch } = options;
    if (items.length === 0) {
      this.latestRenderablePages.clear();
      this.clearRenderQueue();
      return;
    }

    const firstItem = items[0];
    if (!firstItem) return;

    const current = options.currentPage > 0 ? options.currentPage : firstItem.index + 1;
    const pages = items
      .map((item) => item.index + 1)
      .sort((a, b) => getPageRenderPriority(a, current) - getPageRenderPriority(b, current));

    this.renderOptions = options;
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
        maxConcurrent: options.maxConcurrentPageLoads,
      });
    }
    this.processRenderQueue();
  }

  private processRenderQueue(): void {
    const options = this.renderOptions;
    if (!options) return;

    const epoch = this.renderQueueEpoch;
    const zoom = this.renderQueueZoom;
    const rotation = this.renderQueueRotation;

    if (epoch !== options.getViewportEpoch()) return;

    while (this.activePageRenderCount < options.maxConcurrentPageLoads && this.renderQueue.length > 0) {
      const pageNum = this.renderQueue.shift();
      if (pageNum === undefined) return;
      if (!this.latestRenderablePages.has(pageNum)) continue;
      this.activePageRenderCount++;
      console.log('[PdfViewer] fetching/rendering page', {
        pageIndex: pageNum - 1,
        pageNum,
        activePageRenders: this.activePageRenderCount,
        queuedPages: this.renderQueue,
      });
      void this.renderPageSlot(pageNum, zoom, rotation, epoch, options).finally(() => {
        this.activePageRenderCount = Math.max(0, this.activePageRenderCount - 1);
        this.processRenderQueue();
      });
    }
  }

  private async renderPageSlot(
    pageNum: number,
    zoomAtStart: number,
    rotationAtStart: number,
    renderEpoch: number,
    options: QueueVisiblePageRendersOptions,
  ): Promise<void> {
    const rendering = this.renderingPages.get(pageNum);
    if (rendering?.epoch === renderEpoch && rendering.zoom === zoomAtStart && rendering.rotation === rotationAtStart) {
      return;
    }

    this.renderingPages.set(pageNum, { epoch: renderEpoch, zoom: zoomAtStart, rotation: rotationAtStart });
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
      return;
    }
    if (renderEpoch !== options.getViewportEpoch()) {
      this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
      return;
    }
    options.renderer.removeClass(slotElement, 'page-slot--loaded');

    const isSwapped = isRotationSwapped(rotationAtStart);
    const parentWidth = (isSwapped ? dim.height : dim.width) * options.baseScale;
    const parentHeight = (isSwapped ? dim.width : dim.height) * options.baseScale;

    const canvas = options.renderer.createElement('canvas') as HTMLCanvasElement;
    const textLayerDiv = options.renderer.createElement('div') as HTMLDivElement;
    options.renderer.addClass(textLayerDiv, 'textLayer');

    try {
      if (renderEpoch !== options.getViewportEpoch()) {
        console.log('[PdfViewer] skipped stale page before fetch', { pageIndex: pageNum - 1, pageNum });
        this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);
        this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
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
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      return;
    }

    this.finishPageRender(pageNum, renderEpoch, zoomAtStart, rotationAtStart);

    if (options.getLoadGeneration() !== options.loadGeneration) {
      this.pdfViewerService.cleanupTextLayerSelection(textLayerDiv);
      return;
    }
    if (renderEpoch !== options.getViewportEpoch()) {
      console.log('[PdfViewer] discarded stale rendered page', { pageIndex: pageNum - 1, pageNum });
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

    const wrapper = options.renderer.createElement('div') as HTMLDivElement;
    options.renderer.addClass(wrapper, 'canvas-wrapper');
    options.renderer.appendChild(wrapper, canvas);
    options.renderer.appendChild(wrapper, textLayerDiv);

    while (slotElement.firstChild) {
      options.renderer.removeChild(slotElement, slotElement.firstChild);
    }
    options.renderer.appendChild(slotElement, wrapper);
    options.renderer.addClass(slotElement, 'page-slot--loaded');

    this.renderedPages.set(pageNum, { wrapper, canvas, textLayerDiv, zoom: zoomAtStart, rotation: rotationAtStart });
    console.log('[PdfViewer] loaded page into viewer', { pageIndex: pageNum - 1, pageNum });
  }

  private finishPageRender(pageNum: number, epoch: number, zoom: number, rotation: number): void {
    const rendering = this.renderingPages.get(pageNum);
    if (rendering?.epoch === epoch && rendering.zoom === zoom && rendering.rotation === rotation) {
      this.renderingPages.delete(pageNum);
    }
  }

  private evictPage(pageNum: number, scrollElement: HTMLDivElement, renderer: Renderer2): void {
    const rendered = this.renderedPages.get(pageNum);
    if (!rendered) return;

    const slotElement = scrollElement.querySelector(`.page-slot[data-page-num="${pageNum}"]`) as HTMLElement | null;
    this.pdfViewerService.cleanupTextLayerSelection(rendered.textLayerDiv);
    if (slotElement && rendered.wrapper.parentNode === slotElement) {
      renderer.removeChild(slotElement, rendered.wrapper);
      renderer.removeClass(slotElement, 'page-slot--loaded');
    }

    this.renderedPages.delete(pageNum);
    this.renderingPages.delete(pageNum);
  }
}
