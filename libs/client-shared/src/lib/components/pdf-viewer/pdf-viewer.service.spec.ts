// `pdf-viewer.service.ts` imports `pdfjs-dist` at module scope, which jsdom can't run. Stub it
// with a controllable `getDocument` so this spec can drive the exact mid-load destroy race.
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {},
  TextLayer: jest.fn().mockImplementation(() => ({
    render: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn(),
  })),
  version: '0.0.0-test',
}));

import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { getDocument, PageViewport, TextLayer } from 'pdfjs-dist';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { selectIsAnonymousMode } from '../../state/app-shared-state.selectors';
import { PdfLoadSupersededError, TextLayerRenderHandle } from './pdf-viewer.models';
import { PdfViewerService } from './pdf-viewer.service';

/** Mirrors real PDF.js behavior: `destroy()` rejects a still-pending `.promise`. */
function makeControllableLoadingTask() {
  let rejectFn!: (error: unknown) => void;
  let resolveFn!: (doc: unknown) => void;
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  promise.catch(() => undefined);
  const destroy = jest.fn(() => {
    rejectFn(new Error('Worker was destroyed'));
    return Promise.resolve();
  });
  return { promise, resolve: resolveFn, reject: rejectFn, destroy };
}

function makeDocument(
  numPages: number,
  getPage = jest.fn().mockResolvedValue({ getViewport: () => ({ width: numPages, height: 1 }) }),
) {
  return { numPages, getPage };
}

/** Lets pending microtasks (e.g. the `await` inside `loadPdf`) run. */
async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
}

describe('PdfViewerService', () => {
  let service: PdfViewerService;
  let getDocumentMock: jest.Mock;

  beforeEach(() => {
    getDocumentMock = getDocument as jest.Mock;
    getDocumentMock.mockReset();

    TestBed.configureTestingModule({
      providers: [
        PdfViewerService,
        provideMockStore({ selectors: [{ selector: selectIsAnonymousMode, value: false }] }),
      ],
    });
    service = TestBed.inject(PdfViewerService);
    TestBed.inject(MockStore);
  });

  it('invalidates a pending load on abort without destroying it, then releases only the settled task', async () => {
    const task = makeControllableLoadingTask();
    getDocumentMock.mockReturnValue(task);

    const loadPromise = service.loadPdf(1, 2);
    await flushMicrotasks();

    await service.abort();
    expect(task.destroy).not.toHaveBeenCalled();

    task.resolve(makeDocument(3));

    await expect(loadPromise).rejects.toBeInstanceOf(PdfLoadSupersededError);
    expect(task.destroy).toHaveBeenCalledTimes(1);
    await expect(service.getPageDimensions(1)).rejects.toThrow('PDF document not loaded');
  });

  it('reports a superseded load, not a raw error, when a pending load fails after abort', async () => {
    const task = makeControllableLoadingTask();
    getDocumentMock.mockReturnValue(task);

    const loadPromise = service.loadPdf(1, 2);
    await flushMicrotasks();
    await service.abort();

    task.reject(new Error('Network error'));

    await expect(loadPromise).rejects.toBeInstanceOf(PdfLoadSupersededError);
  });

  it('still surfaces a genuine load failure when it is not caused by an abort', async () => {
    const task = makeControllableLoadingTask();
    getDocumentMock.mockReturnValue(task);

    const loadPromise = service.loadPdf(1, 2);
    const networkError = new Error('Network error');
    task.reject(networkError);

    await expect(loadPromise).rejects.toBe(networkError);
  });

  it('resolves with the page count on a successful load', async () => {
    const task = makeControllableLoadingTask();
    getDocumentMock.mockReturnValue(task);

    const loadPromise = service.loadPdf(1, 2);
    task.resolve(makeDocument(7));

    await expect(loadPromise).resolves.toBe(7);
  });

  it('keeps the newer document active and releases only the stale task when a replaced load settles', async () => {
    const firstTask = makeControllableLoadingTask();
    const secondTask = makeControllableLoadingTask();
    getDocumentMock.mockReturnValueOnce(firstTask).mockReturnValueOnce(secondTask);

    const firstLoad = service.loadPdf(1, 2);
    await flushMicrotasks();
    const secondLoad = service.loadPdf(1, 3);
    expect(firstTask.destroy).not.toHaveBeenCalled();

    secondTask.resolve(makeDocument(2));
    await expect(secondLoad).resolves.toBe(2);

    firstTask.resolve(makeDocument(1));
    await expect(firstLoad).rejects.toBeInstanceOf(PdfLoadSupersededError);

    expect(firstTask.destroy).toHaveBeenCalledTimes(1);
    expect(secondTask.destroy).not.toHaveBeenCalled();
    await expect(service.getPageDimensions(1)).resolves.toEqual({ width: 2, height: 1 });
  });

  it('releases the previously completed document when a new one is loaded', async () => {
    const firstTask = makeControllableLoadingTask();
    const secondTask = makeControllableLoadingTask();
    getDocumentMock.mockReturnValueOnce(firstTask).mockReturnValueOnce(secondTask);

    const firstLoad = service.loadPdf(1, 2);
    firstTask.resolve(makeDocument(1));
    await firstLoad;

    const secondLoad = service.loadPdf(1, 3);
    expect(firstTask.destroy).toHaveBeenCalledTimes(1);
    secondTask.resolve(makeDocument(2));
    await secondLoad;

    expect(secondTask.destroy).not.toHaveBeenCalled();
  });

  it('releases the completed document on abort', async () => {
    const task = makeControllableLoadingTask();
    getDocumentMock.mockReturnValue(task);
    const load = service.loadPdf(1, 2);
    task.resolve(makeDocument(1));
    await load;

    await service.abort();

    expect(task.destroy).toHaveBeenCalledTimes(1);
  });

  it('does not use a page that finishes loading after the load was invalidated', async () => {
    const task = makeControllableLoadingTask();
    getDocumentMock.mockReturnValue(task);
    let resolvePage!: (page: unknown) => void;
    const getPage = jest.fn(() => new Promise((resolve) => (resolvePage = resolve)));
    const load = service.loadPdf(1, 2);
    task.resolve(makeDocument(1, getPage));
    await load;

    const dimensions = service.getPageDimensions(1);
    await flushMicrotasks();
    await service.abort();
    resolvePage({ getViewport: () => ({ width: 1, height: 1 }) });

    await expect(dimensions).rejects.toBeInstanceOf(PdfLoadSupersededError);
  });

  it('does not paint a canvas for a page that finishes loading after the load was invalidated', async () => {
    const task = makeControllableLoadingTask();
    getDocumentMock.mockReturnValue(task);
    let resolvePage!: (page: unknown) => void;
    const getPage = jest.fn(() => new Promise((resolve) => (resolvePage = resolve)));
    const load = service.loadPdf(1, 2);
    task.resolve(makeDocument(1, getPage));
    await load;

    const canvas = document.createElement('canvas');
    const getContext = jest.spyOn(canvas, 'getContext');
    const render = service.renderPageToCanvas(canvas, 1, 100, 100, 1);
    await flushMicrotasks();
    await service.abort();
    resolvePage({ getViewport: () => ({ width: 1, height: 1 }), render: jest.fn() });

    await expect(render).rejects.toBeInstanceOf(PdfLoadSupersededError);
    expect(getContext).not.toHaveBeenCalled();
  });

  it('rejects a superseded load when a newer loadPdf() call starts before the first resolves', async () => {
    const firstTask = makeControllableLoadingTask();
    const secondTask = makeControllableLoadingTask();
    getDocumentMock.mockReturnValueOnce(firstTask).mockReturnValueOnce(secondTask);

    const firstLoad = service.loadPdf(1, 2);
    await Promise.resolve();
    await Promise.resolve();
    const secondLoad = service.loadPdf(1, 3);

    firstTask.resolve(makeDocument(1));
    secondTask.resolve(makeDocument(2));

    await expect(firstLoad).rejects.toBeInstanceOf(PdfLoadSupersededError);
    await expect(secondLoad).resolves.toBe(2);
  });

  describe('renderTextLayer', () => {
    const originalFonts = (document as unknown as { fonts?: unknown }).fonts;

    beforeEach(() => {
      // jsdom has no FontFaceSet; renderTextLayer() awaits document.fonts.ready.
      (document as unknown as { fonts: unknown }).fonts = { ready: Promise.resolve() };
    });

    afterEach(() => {
      (document as unknown as { fonts: unknown }).fonts = originalFonts;
    });

    it('never constructs a TextLayer if the load was invalidated while getTextContent() is pending', async () => {
      let resolveTextContent!: (value: unknown) => void;
      const page = {
        getTextContent: jest.fn(() => new Promise((resolve) => (resolveTextContent = resolve))),
      } as unknown as PDFPageProxy;
      const textLayerDiv = document.createElement('div');

      const renderPromise = service.renderTextLayer(page, textLayerDiv, { scale: 1 } as PageViewport);
      await service.abort();
      resolveTextContent({ items: [], styles: {} });
      await renderPromise;

      expect(TextLayer as unknown as jest.Mock).not.toHaveBeenCalled();
      expect(textLayerDiv.style.getPropertyValue('--scale-factor')).toBe('');
    });

    it('never constructs a TextLayer if cancelled while getTextContent() is still pending', async () => {
      let resolveTextContent!: (value: unknown) => void;
      const page = {
        getTextContent: jest.fn(() => new Promise((resolve) => (resolveTextContent = resolve))),
      } as unknown as PDFPageProxy;
      const viewport = { scale: 1 } as PageViewport;
      const textLayerDiv = document.createElement('div');
      const handle = new TextLayerRenderHandle();

      const renderPromise = service.renderTextLayer(page, textLayerDiv, viewport, handle);

      handle.cancel();
      resolveTextContent({ items: [], styles: {} });
      await renderPromise;

      expect(TextLayer as unknown as jest.Mock).not.toHaveBeenCalled();
      expect(textLayerDiv.style.getPropertyValue('--scale-factor')).toBe('');
    });

    it('does not set up selection behavior if cancelled while textLayer.render() was pending', async () => {
      const page = {
        getTextContent: jest.fn().mockResolvedValue({ items: [], styles: {} }),
      } as unknown as PDFPageProxy;
      const viewport = { scale: 1 } as PageViewport;
      const textLayerDiv = document.createElement('div');
      const handle = new TextLayerRenderHandle();

      let resolveRender!: () => void;
      const cancel = jest.fn();
      (TextLayer as unknown as jest.Mock).mockImplementationOnce(() => ({
        render: jest.fn(() => new Promise<void>((resolve) => (resolveRender = resolve))),
        cancel,
      }));
      const hideSpy = jest
        .spyOn(PdfViewerService as unknown as { hidePdfjsMeasurementCanvas: () => void }, 'hidePdfjsMeasurementCanvas')
        .mockImplementation(() => undefined);

      const renderPromise = service.renderTextLayer(page, textLayerDiv, viewport, handle);
      await Promise.resolve();
      await Promise.resolve();

      handle.cancel();
      resolveRender();
      await renderPromise;

      expect(hideSpy).not.toHaveBeenCalled();
      hideSpy.mockRestore();
    });
  });
});
