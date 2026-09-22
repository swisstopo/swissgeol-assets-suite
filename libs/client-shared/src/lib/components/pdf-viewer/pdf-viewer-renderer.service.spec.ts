import { Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PageDimension } from '@asset-sg/shared/v2';
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
  let scrollElement: HTMLDivElement;
  let consoleErrorSpy: jest.SpyInstance;

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
    const pdfViewerServiceMock = {
      renderPageToCanvas,
      cleanupTextLayerSelections: jest.fn(),
      cleanupTextLayerSelection: jest.fn(),
      renderTextLayer: jest.fn().mockResolvedValue(undefined),
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
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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
});
