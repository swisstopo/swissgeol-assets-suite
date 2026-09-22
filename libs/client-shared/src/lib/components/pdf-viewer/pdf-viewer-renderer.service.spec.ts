import { Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PageDimension } from '@asset-sg/shared/v2';
import type { TextLayer } from 'pdfjs-dist';
import { PdfViewerRendererService } from './pdf-viewer-renderer.service';
import { PdfViewerVirtualItem } from './pdf-viewer.models';
import { PdfViewerService } from './pdf-viewer.service';

// `pdf-viewer.service.ts` imports `pdfjs-dist` at module scope, which needs browser APIs
// (e.g. `DOMMatrix`) jsdom lacks. Stub it out since this spec only needs it for DI.
jest.mock('./pdf-viewer.service', () => ({
  PdfViewerService: class PdfViewerService {},
}));

function createFakeRenderer(): Renderer2 {
  return {
    createElement: (name: string) => document.createElement(name),
    addClass: (el: Element, cls: string) => el.classList.add(cls),
    removeClass: (el: Element, cls: string) => el.classList.remove(cls),
    appendChild: (parent: Node, child: Node) => parent.appendChild(child),
  } as unknown as Renderer2;
}

/** Flushes real timers/microtasks (the drain service uses real `setTimeout(0)`). */
function flush(rounds = 3): Promise<void> {
  return rounds <= 0
    ? Promise.resolve()
    : new Promise((resolve) => setTimeout(() => flush(rounds - 1).then(resolve), 0));
}

describe('PdfViewerRendererService', () => {
  let service: PdfViewerRendererService;
  let renderPageToCanvas: jest.Mock;
  let renderTextLayer: jest.Mock;
  let scrollElement: HTMLDivElement;
  let consoleErrorSpy: jest.SpyInstance;
  let rafSpy: jest.SpyInstance;
  let cafSpy: jest.SpyInstance;

  const items: PdfViewerVirtualItem[] = [
    { index: 0, key: 1, start: 0, end: 100, size: 100, pageNum: 1, pageWidth: 100, transform: '' },
  ];
  const pageDimensions: PageDimension[] = [{ page: 1, width: 100, height: 100 }];

  function buildOptions() {
    return {
      items,
      currentPage: 1,
      expectedZoom: 1,
      expectedRotation: 0,
      maxConcurrentPageLoads: 3,
      scrollElement,
      renderer: createFakeRenderer(),
      pageDimensions,
      baseScale: 1,
      loadGeneration: 0,
      getViewportEpoch: () => 0,
      getLoadGeneration: () => 0,
      getZoom: () => 1,
      getRotation: () => 0,
      getCurrentPage: () => 1,
      getRenderMode: () => 'normal' as const,
      scheduleVirtualRefresh: () => undefined,
      renderMode: 'normal' as const,
    };
  }

  type RenderResult = { page: unknown; viewport: unknown; nativeWidth: number; nativeHeight: number };

  /** A no-op `.catch()` is attached so this test-owned promise reference is never itself
   * reported as unhandled; production code attaches its own handler via `tryExecuteRender()`. */
  function makeControllableRender() {
    let reject!: (error: unknown) => void;
    let resolve!: (value: RenderResult) => void;
    const promise = new Promise<RenderResult>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    promise.catch(() => undefined);
    const cancel = jest.fn(() => {
      const error = new Error('Rendering cancelled');
      error.name = 'RenderingCancelledException';
      reject(error);
    });
    return { promise, resolve, reject, cancel };
  }

  beforeEach(() => {
    renderPageToCanvas = jest.fn();
    renderTextLayer = jest.fn().mockResolvedValue(undefined);
    const pdfViewerServiceMock = {
      renderPageToCanvas,
      cleanupTextLayerSelections: jest.fn(),
      cleanupTextLayerSelection: jest.fn(),
      renderTextLayer,
    };

    TestBed.configureTestingModule({
      providers: [PdfViewerRendererService, { provide: PdfViewerService, useValue: pdfViewerServiceMock }],
    });
    service = TestBed.inject(PdfViewerRendererService);

    scrollElement = document.createElement('div');
    const slot = document.createElement('div');
    slot.className = 'page-slot';
    slot.dataset['pageNum'] = '1';
    scrollElement.appendChild(slot);

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    // Replace rAF with a real macrotask so `flush()` (real `setTimeout(0)` chain) can
    // deterministically wait for the text-layer scheduling without relying on the
    // ~16ms real animation-frame cadence.
    rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => setTimeout(() => cb(0), 0) as unknown as number);
    cafSpy = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((id) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it('cancels in-flight render tasks and never dispatches again once destroyed', async () => {
    const render = makeControllableRender();
    renderPageToCanvas.mockImplementation((_canvas, _pageNum, _w, _h, _zoom, _rotation, onRenderTask) => {
      onRenderTask?.(render);
      return render.promise;
    });

    service.queueVisiblePageRenders(buildOptions());
    expect(renderPageToCanvas).toHaveBeenCalledTimes(1);

    service.ngOnDestroy();
    expect(render.cancel).toHaveBeenCalledTimes(1);

    // Without the fix, this would re-arm drainSlots() and dispatch the same page forever.
    await flush();

    expect(renderPageToCanvas).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('suppresses logging for any error that settles after the service was destroyed', async () => {
    const render = makeControllableRender();
    renderPageToCanvas.mockImplementation((_canvas, _pageNum, _w, _h, _zoom, _rotation, onRenderTask) => {
      onRenderTask?.(render);
      return render.promise;
    });

    service.queueVisiblePageRenders(buildOptions());
    service.ngOnDestroy();

    render.reject(new Error('Worker was destroyed'));
    await flush();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('still logs a genuine render failure while the service is alive and current', async () => {
    const render = makeControllableRender();
    renderPageToCanvas.mockImplementation((_canvas, _pageNum, _w, _h, _zoom, _rotation, onRenderTask) => {
      onRenderTask?.(render);
      return render.promise;
    });

    service.queueVisiblePageRenders(buildOptions());

    render.reject(new Error('Network error'));
    await flush();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to render page 1', expect.any(Error));
  });

  describe('genuine page-render failures', () => {
    it('does not redispatch a page that failed for a genuine (non-cancellation) reason', async () => {
      renderPageToCanvas.mockRejectedValue(new Error('Corrupt page data'));

      service.queueVisiblePageRenders(buildOptions());
      await flush(5);

      expect(renderPageToCanvas).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      // Further drain cycles (triggered by dispatchRender's .finally()) must not retry.
      await flush(5);
      expect(renderPageToCanvas).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('retries a previously failed page once the zoom changes', async () => {
      renderPageToCanvas.mockRejectedValueOnce(new Error('Corrupt page data'));
      service.queueVisiblePageRenders(buildOptions());
      await flush(5);
      expect(renderPageToCanvas).toHaveBeenCalledTimes(1);

      renderPageToCanvas.mockResolvedValueOnce({ page: {}, viewport: {}, nativeWidth: 100, nativeHeight: 100 });
      service.queueVisiblePageRenders({ ...buildOptions(), getZoom: () => 2 });
      await flush(5);

      expect(renderPageToCanvas).toHaveBeenCalledTimes(2);
    });

    it('retries a previously failed page after resetPages()', async () => {
      renderPageToCanvas.mockRejectedValueOnce(new Error('Corrupt page data'));
      service.queueVisiblePageRenders(buildOptions());
      await flush(5);
      expect(renderPageToCanvas).toHaveBeenCalledTimes(1);

      service.resetPages();
      renderPageToCanvas.mockResolvedValueOnce({ page: {}, viewport: {}, nativeWidth: 100, nativeHeight: 100 });
      service.queueVisiblePageRenders(buildOptions());
      await flush(5);

      expect(renderPageToCanvas).toHaveBeenCalledTimes(2);
    });

    it('ignores a genuine failure that arrives from a stale document after a newer one has started', async () => {
      let currentGeneration = 0;
      const render = makeControllableRender();
      // No onRenderTask call — simulates document A's render staying in flight uncancelled
      // (e.g. cancel() didn't reach it in time) while document B replaces it.
      renderPageToCanvas.mockImplementationOnce(() => render.promise);
      service.queueVisiblePageRenders({
        ...buildOptions(),
        loadGeneration: 0,
        getLoadGeneration: () => currentGeneration,
      });
      expect(renderPageToCanvas).toHaveBeenCalledTimes(1);

      service.resetPages();
      currentGeneration = 1;
      renderPageToCanvas.mockResolvedValueOnce({ page: {}, viewport: {}, nativeWidth: 100, nativeHeight: 100 });
      service.queueVisiblePageRenders({
        ...buildOptions(),
        loadGeneration: 1,
        getLoadGeneration: () => currentGeneration,
      });
      await flush(5);
      expect(service.getRenderedPage(1)).not.toBeNull();

      // Document A's stale render now fails for a genuine (non-cancellation) reason.
      render.reject(new Error('Corrupt page data'));
      await flush(5);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(service.getRenderedPage(1)).not.toBeNull();
    });
  });

  describe('text-layer teardown', () => {
    function renderPageSuccessfully() {
      renderPageToCanvas.mockResolvedValue({ page: {}, viewport: {}, nativeWidth: 100, nativeHeight: 100 });
      service.queueVisiblePageRenders(buildOptions());
    }

    it('cancels an in-flight text-layer render on teardown', async () => {
      const cancel = jest.fn();
      renderTextLayer.mockImplementation((_page, _div, _viewport, handle) => {
        handle?.attach({ cancel } as unknown as TextLayer);
        return new Promise(() => undefined); // stays pending — still "running" at teardown
      });

      renderPageSuccessfully();
      await flush(5);

      expect(renderTextLayer).toHaveBeenCalledTimes(1);

      service.ngOnDestroy();

      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('cancels a TextLayer that is attached only after teardown was requested', async () => {
      const cancel = jest.fn();
      let attachLate!: () => void;
      renderTextLayer.mockImplementation((_page, _div, _viewport, handle) => {
        // Simulates renderTextLayer() constructing its TextLayer only after getTextContent()
        // resolves, which may happen after teardown already called handle.cancel().
        return new Promise((resolve) => {
          attachLate = () => {
            handle?.attach({ cancel } as unknown as TextLayer);
            resolve(undefined);
          };
        });
      });

      renderPageSuccessfully();
      await flush(5);
      expect(renderTextLayer).toHaveBeenCalledTimes(1);

      // Teardown happens while getTextContent() is still pending — no TextLayer exists yet.
      service.ngOnDestroy();
      expect(cancel).not.toHaveBeenCalled();

      // getTextContent() resolves late and attaches the TextLayer; TextLayerRenderHandle must
      // cancel it immediately since cancellation was already requested.
      attachLate();
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('suppresses logging when the cancelled text layer rejects with AbortException', async () => {
      let reject!: (error: unknown) => void;
      renderTextLayer.mockImplementation(() => new Promise((_resolve, rej) => (reject = rej)));

      renderPageSuccessfully();
      await flush(5);

      service.ngOnDestroy();
      const abortError = new Error('TextLayer task cancelled.');
      abortError.name = 'AbortException';
      reject(abortError);
      await flush(5);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('still logs a genuine text-layer failure while the page is still active', async () => {
      let reject!: (error: unknown) => void;
      renderTextLayer.mockImplementation(() => new Promise((_resolve, rej) => (reject = rej)));

      renderPageSuccessfully();
      await flush(5);

      reject(new Error('Font loading failed'));
      await flush(5);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to render text layer for page 1', expect.any(Error));
    });

    it('suppresses a genuine text-layer failure if the page was replaced before it settled', async () => {
      let reject!: (error: unknown) => void;
      renderTextLayer.mockImplementation(() => new Promise((_resolve, rej) => (reject = rej)));

      renderPageSuccessfully();
      await flush(5);

      // A newer render for the same page number replaced the entry this text-layer render was
      // scheduled for (e.g. re-render after a zoom/rotation change).
      const renderedPages = (service as unknown as { renderedPages: Map<number, unknown> }).renderedPages;
      renderedPages.set(1, { textLayerRendered: false });

      reject(new Error('Font loading failed'));
      await flush(5);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
