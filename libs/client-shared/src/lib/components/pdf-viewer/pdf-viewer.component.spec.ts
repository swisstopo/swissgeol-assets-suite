// jsdom does not implement `ResizeObserver`, which the component and its virtualizer both use.
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
  MockResizeObserver as unknown as typeof ResizeObserver;

// `pdf-viewer.service.ts` imports `pdfjs-dist` at module scope, which needs `DOMMatrix` (not
// available in jsdom). Stubbed even though DI below uses a mock instance, since the module is
// still `require()`-d for its class reference.
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {},
  TextLayer: class MockTextLayer {},
  version: '0.0.0-test',
}));

// `../../utils` re-exports `./map`, which imports OpenLayers (ESM-only, unsupported by Jest here).
// The component only needs `triggerDownload` from this barrel.
jest.mock('../../utils', () => ({ triggerDownload: jest.fn() }));

// The child components statically imported by `pdf-viewer.component.ts` import
// `@swissgeol/ui-core-angular`, which fails to resolve under Jest. They're stripped from the
// template via `overrideComponent`/`NO_ERRORS_SCHEMA` below, so this stub only avoids an
// import-time crash.
jest.mock('@swissgeol/ui-core-angular', () => ({
  SgcButton: class MockSgcButton {},
  SgcIcon: class MockSgcIcon {},
  SgcSelect: class MockSgcSelect {},
}));

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { showAlert } from '../../state/alert/alert.actions';
import { PdfSlowLoadingService } from './pdf-slow-loading.service';
import { PdfViewerApiService } from './pdf-viewer-api.service';
import { PdfViewerHandoverService } from './pdf-viewer-handover.service';
import { PdfViewerInputService } from './pdf-viewer-input.service';
import { PdfViewerRendererService } from './pdf-viewer-renderer.service';
import { PdfViewerComponent } from './pdf-viewer.component';
import { PdfViewerFile } from './pdf-viewer.models';
import { PdfViewerService } from './pdf-viewer.service';

/** Deferred promise to control exactly when a mocked async dependency settles. */
function defer<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promise.catch(() => undefined);
  return { promise, resolve, reject };
}

describe('PdfViewerComponent', () => {
  let pdfViewerServiceMock: Record<string, jest.Mock>;
  let rendererServiceMock: Record<string, jest.Mock>;
  let inputServiceMock: Record<string, jest.Mock>;
  let handoverServiceMock: Record<string, jest.Mock>;
  let slowLoadingServiceMock: Record<string, jest.Mock>;
  let apiServiceMock: { fetchMetadata: jest.Mock };
  let store: Store;
  let consoleErrorSpy: jest.SpyInstance;

  const testFile: PdfViewerFile = { id: 10, fileName: 'a.pdf', pageRangeClassifications: null };

  beforeEach(() => {
    pdfViewerServiceMock = {
      loadPdf: jest.fn(),
      getPageDimensions: jest.fn(),
      abort: jest.fn().mockResolvedValue(undefined),
      renderPageToCanvas: jest.fn(),
      cleanupTextLayerSelections: jest.fn(),
      cleanupTextLayerSelection: jest.fn(),
    };
    rendererServiceMock = {
      resetPages: jest.fn(),
      evictAllRenderedPages: jest.fn(),
      prepareForZoomRender: jest.fn(),
      getRenderedPage: jest.fn(),
      updateVisiblePages: jest.fn(),
      scaleAllStalePreviews: jest.fn(),
      evictPagesOutside: jest.fn(),
      queueVisiblePageRenders: jest.fn(),
    };
    inputServiceMock = {
      destroy: jest.fn(),
      startPanDrag: jest.fn(),
      setup: jest.fn(),
      finishPanDrag: jest.fn(),
    };
    handoverServiceMock = {
      end: jest.fn(),
      begin: jest.fn(),
      isActive: jest.fn().mockReturnValue(false),
      releasePage: jest.fn(),
    };
    slowLoadingServiceMock = {
      reset: jest.fn(),
      beginLoading: jest.fn(),
      completeLoading: jest.fn(),
    };
    apiServiceMock = { fetchMetadata: jest.fn() };

    TestBed.configureTestingModule({
      imports: [PdfViewerComponent],
      providers: [
        provideMockStore(),
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        { provide: PdfViewerApiService, useValue: apiServiceMock },
      ],
    });

    // `PdfViewerService`/`PdfViewerInputService`/`PdfViewerRendererService`/`PdfViewerHandoverService`/
    // `PdfSlowLoadingService` are provided in the component's own `providers` array, so they must
    // be swapped via `overrideComponent`. Child components are stripped from `imports` (relying on
    // `NO_ERRORS_SCHEMA`) since they aren't needed for the destroy/load race under test.
    TestBed.overrideComponent(PdfViewerComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          { provide: PdfViewerService, useValue: pdfViewerServiceMock },
          { provide: PdfViewerInputService, useValue: inputServiceMock },
          { provide: PdfViewerRendererService, useValue: rendererServiceMock },
          { provide: PdfViewerHandoverService, useValue: handoverServiceMock },
          { provide: PdfSlowLoadingService, useValue: slowLoadingServiceMock },
        ],
      },
    });

    store = TestBed.inject(Store);
    jest.spyOn(store, 'dispatch');
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(PdfViewerComponent);
    fixture.componentRef.setInput('assetId', 1);
    fixture.componentRef.setInput('assetPdfs', [testFile]);
    fixture.componentRef.setInput('hideHeader', true);
    return fixture;
  }

  /** Flushes the selectedPdf -> rendering effect chain that triggers `loadPdf()`. */
  async function renderAndFlush(fixture: ReturnType<typeof createFixture>) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('aborts the PDF.js worker and stops the renderer without any unhandled rejection or alert when destroyed mid-load', async () => {
    const loadPdfDeferred = defer<number>();
    const metadataDeferred = defer<{ pageDimensions: never[] }>();
    pdfViewerServiceMock['loadPdf'].mockReturnValue(loadPdfDeferred.promise);
    apiServiceMock.fetchMetadata.mockReturnValue(metadataDeferred.promise);

    const fixture = createFixture();
    await renderAndFlush(fixture);

    expect(pdfViewerServiceMock['loadPdf']).toHaveBeenCalledWith(1, 10);

    fixture.destroy();

    expect(pdfViewerServiceMock['abort']).toHaveBeenCalledTimes(1);
    expect(rendererServiceMock['resetPages']).toHaveBeenCalled();

    // Settles only after destroy, with a raw PDF.js-style error caused by our own abort().
    loadPdfDeferred.reject(new Error('Worker was destroyed'));
    metadataDeferred.resolve({ pageDimensions: [] });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(store.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: showAlert.type }));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('still reports a genuine load failure with an alert while the viewer remains open', async () => {
    const loadPdfDeferred = defer<number>();
    const metadataDeferred = defer<{ pageDimensions: never[] }>();
    pdfViewerServiceMock['loadPdf'].mockReturnValue(loadPdfDeferred.promise);
    apiServiceMock.fetchMetadata.mockReturnValue(metadataDeferred.promise);

    const fixture = createFixture();
    await renderAndFlush(fixture);

    const networkError = new Error('Network error');
    loadPdfDeferred.reject(networkError);
    metadataDeferred.resolve({ pageDimensions: [] });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: showAlert.type }));
  });
});
