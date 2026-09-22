// `pdf-viewer.service.ts` imports `pdfjs-dist` at module scope, which jsdom can't run. Stub it
// with a controllable `getDocument` so this spec can drive the exact mid-load destroy race.
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {},
  TextLayer: class MockTextLayer {},
  version: '0.0.0-test',
}));

import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { getDocument } from 'pdfjs-dist';
import { selectIsAnonymousMode } from '../../state/app-shared-state.selectors';
import { PdfLoadSupersededError } from './pdf-viewer.models';
import { PdfViewerService } from './pdf-viewer.service';

/** Mirrors real PDF.js behavior: `destroy()` rejects the still-pending `.promise`. */
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

  it('rejects with PdfLoadSupersededError and destroys the loading task when aborted mid-load', async () => {
    const task = makeControllableLoadingTask();
    getDocumentMock.mockReturnValue(task);

    const loadPromise = service.loadPdf(1, 2);

    // Let loadPdf() reach getDocument() before we abort, so a task genuinely exists in flight.
    await Promise.resolve();
    await Promise.resolve();

    await service.abort();

    await expect(loadPromise).rejects.toBeInstanceOf(PdfLoadSupersededError);
    expect(task.destroy).toHaveBeenCalledTimes(1);
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
    task.resolve({ numPages: 7 });

    await expect(loadPromise).resolves.toBe(7);
  });

  it('rejects a superseded load when a newer loadPdf() call starts before the first resolves', async () => {
    const firstTask = makeControllableLoadingTask();
    const secondTask = makeControllableLoadingTask();
    getDocumentMock.mockReturnValueOnce(firstTask).mockReturnValueOnce(secondTask);

    const firstLoad = service.loadPdf(1, 2);
    await Promise.resolve();
    await Promise.resolve();
    const secondLoad = service.loadPdf(1, 3);

    firstTask.resolve({ numPages: 1 });
    secondTask.resolve({ numPages: 2 });

    await expect(firstLoad).rejects.toBeInstanceOf(PdfLoadSupersededError);
    await expect(secondLoad).resolves.toBe(2);
  });
});
