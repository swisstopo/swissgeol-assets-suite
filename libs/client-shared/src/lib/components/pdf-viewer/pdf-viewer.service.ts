import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
  getDocument,
  GlobalWorkerOptions,
  PageViewport,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  TextLayer,
  version,
} from 'pdfjs-dist';
import { PDFPageProxy, TextContent } from 'pdfjs-dist/types/src/display/api';
import { SessionStorageService } from '../../services/session-storage.service';
import { selectIsAnonymousMode } from '../../state/app-shared-state.selectors';
import { PdfRenderTask, PDF_VIEWER_DEBUG } from './pdf-viewer.models';

// Worker source for PDF JS. Note that this must match the path that is defined in the builder configuration.
// The version query parameter busts the browser cache when the pdfjs-dist version changes, since the worker
// filename itself has no content hash.
GlobalWorkerOptions.workerSrc = `assets/pdfjs/pdf.worker.min.mjs?v=${version}`;

@Injectable()
export class PdfViewerService implements OnDestroy {
  private loadingTask: PDFDocumentLoadingTask | undefined;
  private pdfDoc: PDFDocumentProxy | undefined;
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly ngZone = inject(NgZone);
  private readonly selectionAbortControllers = new Map<HTMLElement, AbortController>();
  private readonly store = inject(Store);
  private readonly isViewApp = toSignal(this.store.select(selectIsAnonymousMode));

  async ngOnDestroy() {
    this.cleanupTextLayerSelections();
    await this.destroyPdfJsWorker();
  }

  /**
   * Tries to incrementally load a PDF document by using range requests. This is, however, dependent on the PDF itself
   * and there are cases where PDFJS cannot reliably chunk the PDF. In these cases, PDFJS will proceed to load the
   * entire PDF (as chunks), which can lead to out-of-memory errors for large PDFs, irresponsive browsers on slower
   * devices, increased load on the server, and last but not least: data consumption for the client.
   *
   * However, there is currently no reliable way of predetermining whether a PDF can be loaded incrementally or not, and
   * we cannot abort PDFJS loading once it started. Workarounds would include counting the amount of chunks that are
   * fetched; but given that we don't know how many chunks a PDF would need to be fully loaded, this is not a reliable
   * method.
   * @param assetId
   * @param pdfId
   */
  public async loadPdf(assetId: number, pdfId: number): Promise<number> {
    await this.destroyPdfJsWorker();

    this.loadingTask = getDocument({
      url: `/api/assets/${assetId}/files/${pdfId}`,
      httpHeaders: this.getAuthorizationHeader(),
      disableAutoFetch: true,
      disableStream: true,
    });
    try {
      this.pdfDoc = await this.loadingTask.promise;
      return this.pdfDoc.numPages;
    } catch (e) {
      /**
       * In theory, we could catch an out of memory error here, as the error thrown is along these lines:
       * UnknownErrorException{message: 'Array buffer allocation failed', name: 'UnknownErrorException', details:
       * 'RangeError: Array buffer allocation failed', stack: 'Error\n    at BaseExceptionClosure (http://localhos…oke
       * (http://localhost:4200/polyfills.js:3135:158)'}
       *
       * However, this should be tackled once it occurs in practice; as for now, we don't know if this ocurrs. It is
       * better to implement a maximum file size limit for PDFs to be visible online instead of catching the error,
       * since recovery behaviour is not yet defined.
       */
      console.log('Error rendering PDF');

      throw e;
    }
  }

  public async getPageDimensions(pageNum: number): Promise<{ width: number; height: number }> {
    if (!this.pdfDoc) {
      throw new Error('PDF document not loaded');
    }
    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    return { width: viewport.width, height: viewport.height };
  }
  public async renderPageToCanvas(
    canvas: HTMLCanvasElement,
    pageNum: number,
    parentWidth: number,
    parentHeight: number,
    zoom: number,
    rotation = 0,
    onRenderTask?: (renderTask: PdfRenderTask) => void,
  ): Promise<{
    page: PDFPageProxy;
    viewport: PageViewport;
    nativeWidth: number;
    nativeHeight: number;
  }> {
    if (!this.pdfDoc) {
      throw new Error('PDF document not loaded');
    }

    const timeStart = performance.now();
    const page = await this.pdfDoc.getPage(pageNum);
    // Always store unrotated native dimensions for stable slot sizing
    const unscaledViewport = page.getViewport({ scale: 1 });
    const viewport = this.prepareViewport(page, parentWidth, parentHeight, zoom, rotation);
    this.prepareCanvas(canvas, viewport);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2d context from canvas');
    }
    const renderTask = page.render({
      canvasContext: context,
      viewport,
      canvas,
    });
    onRenderTask?.(renderTask);
    await renderTask.promise;
    const timeElapsed = performance.now() - timeStart;
    if (PDF_VIEWER_DEBUG) {
      console.log(
        `%c[pdf-queue] %cloaded page with num ${pageNum} in ${timeElapsed.toFixed(2)}`,
        'background: #28a745; color: white; padding: 4px; border-radius: 4px;',
        'font-weight: bold;',
      );
    }
    return {
      page,
      viewport,
      nativeWidth: unscaledViewport.width,
      nativeHeight: unscaledViewport.height,
    };
  }

  public cleanupTextLayerSelection(textLayerDiv: HTMLElement): void {
    this.selectionAbortControllers.get(textLayerDiv)?.abort();
    this.selectionAbortControllers.delete(textLayerDiv);
  }

  public cleanupTextLayerSelections(): void {
    for (const controller of this.selectionAbortControllers.values()) {
      controller.abort();
    }
    this.selectionAbortControllers.clear();
  }

  public async renderTextLayer(page: PDFPageProxy, textLayerDiv: HTMLElement, viewport: PageViewport) {
    const textContent = await page.getTextContent({
      disableNormalization: true,
    });
    await document.fonts.ready;

    // These CSS variables must be set before constructing TextLayer, because the constructor
    // calls setLayerDimensions which computes width/height from --total-scale-factor.
    textLayerDiv.style.setProperty('--scale-factor', viewport.scale.toString());
    textLayerDiv.style.setProperty('--total-scale-factor', viewport.scale.toString());
    textLayerDiv.style.setProperty('--scale-round-x', '1px');
    textLayerDiv.style.setProperty('--scale-round-y', '1px');

    const textLayer = new TextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport,
    });
    await textLayer.render();
    PdfViewerService.hidePdfjsMeasurementCanvas();
    this.setupSelectionBehavior(textLayerDiv);
    this.correctTextLayerScaleX(textLayer, textContent, viewport);
  }

  /**
   * PDF.js TextLayer computes --scale-x per span using canvas 2D measureText(), which can produce
   * different widths than the browser's CSS text layout engine for the same font. This causes spans
   * to be wider or narrower than the actual rendered text on the canvas.
   *
   * This method recomputes --scale-x using actual DOM measurements (getBoundingClientRect) to match
   * the CSS-rendered span widths to the expected PDF text widths.
   *
   * Writes and reads are batched to avoid O(n) forced reflows (layout thrashing).
   */
  private correctTextLayerScaleX(textLayer: TextLayer, textContent: TextContent, viewport: PageViewport) {
    const textDivs = textLayer.textDivs;
    const textItems = textContent.items.filter((item) => 'str' in item && 'width' in item);

    // --- Batch write: remove transforms so natural widths can be measured ---
    const savedTransforms: string[] = [];
    for (let i = 0; i < textDivs.length && i < textItems.length; i++) {
      savedTransforms.push(textDivs[i].style.transform);
      textDivs[i].style.transform = 'none';
    }

    // --- Batch read: measure all natural widths in one pass (single reflow) ---
    const measurements: {
      index: number;
      expectedCssWidth: number;
      naturalWidth: number;
    }[] = [];
    for (let i = 0; i < textDivs.length && i < textItems.length; i++) {
      const item = textItems[i];
      if (!item.width || !textDivs[i].textContent) {
        continue;
      }
      measurements.push({
        index: i,
        expectedCssWidth: item.width * viewport.scale,
        naturalWidth: textDivs[i].getBoundingClientRect().width,
      });
    }

    // --- Batch write: restore transforms and apply corrected --scale-x ---
    for (let i = 0; i < textDivs.length && i < textItems.length; i++) {
      textDivs[i].style.transform = savedTransforms[i];
    }
    for (const { index, expectedCssWidth, naturalWidth } of measurements) {
      if (naturalWidth > 0) {
        textDivs[index].style.setProperty('--scale-x', (expectedCssWidth / naturalWidth).toString());
      }
    }
  }

  /**
   * Replicates the pdfjs viewer's TextLayerBuilder selection behavior.
   *
   * The endOfContent div is dynamically repositioned next to the selection anchor during
   * active selection, giving the browser a proper continuation target and preventing
   * erratic jumps across absolutely-positioned spans.
   *
   * Adapted from pdfjs-dist/web/pdf_viewer.mjs TextLayerBuilder.#bindMouse
   * and TextLayerBuilder.#enableGlobalSelectionListener.
   */
  private setupSelectionBehavior(textLayerDiv: HTMLElement) {
    this.cleanupTextLayerSelection(textLayerDiv);
    const abortController = new AbortController();
    this.selectionAbortControllers.set(textLayerDiv, abortController);
    const { signal } = abortController;

    const endOfContent = document.createElement('div');
    endOfContent.className = 'endOfContent';
    textLayerDiv.append(endOfContent);

    const reset = () => {
      textLayerDiv.append(endOfContent);
      endOfContent.style.width = '';
      endOfContent.style.height = '';
      textLayerDiv.classList.remove('selecting');
    };

    let isPointerDown = false;
    let prevRange: Range | null = null;

    // Run outside Angular zone to avoid triggering change detection on every
    // pointer/selection event — none of these modify Angular-managed state.
    this.ngZone.runOutsideAngular(() => {
      textLayerDiv.addEventListener(
        'mousedown',
        () => {
          textLayerDiv.classList.add('selecting');
        },
        { signal },
      );

      document.addEventListener(
        'pointerdown',
        () => {
          isPointerDown = true;
        },
        { signal },
      );

      document.addEventListener(
        'pointerup',
        () => {
          isPointerDown = false;
          reset();
        },
        { signal },
      );

      window.addEventListener(
        'blur',
        () => {
          isPointerDown = false;
          reset();
        },
        { signal },
      );

      document.addEventListener(
        'keyup',
        () => {
          if (!isPointerDown) {
            reset();
          }
        },
        { signal },
      );

      document.addEventListener(
        'selectionchange',
        () => {
          const selection = document.getSelection();
          if (!selection || selection.rangeCount === 0) {
            reset();
            return;
          }

          const range = selection.getRangeAt(0);
          if (!range.intersectsNode(textLayerDiv)) {
            reset();
            return;
          }

          textLayerDiv.classList.add('selecting');

          const modifyStart =
            prevRange &&
            (range.compareBoundaryPoints(Range.END_TO_END, prevRange) === 0 ||
              range.compareBoundaryPoints(Range.START_TO_END, prevRange) === 0);

          let anchor = modifyStart ? range.startContainer : range.endContainer;
          if (anchor.nodeType === Node.TEXT_NODE) {
            if (!anchor.parentNode) return;
            anchor = anchor.parentNode;
          }

          if (!modifyStart && range.endOffset === 0) {
            let node: Node | null = anchor;
            while (node) {
              while (!node.previousSibling) {
                node = node.parentNode;
                if (!node) break;
              }
              if (!node) break;
              node = node.previousSibling;
              if (node?.childNodes.length) break;
            }
            if (node) anchor = node;
          }

          const parentTextLayer = (anchor as HTMLElement).parentElement?.closest('.textLayer');
          if (parentTextLayer === textLayerDiv) {
            const anchorParent = (anchor as HTMLElement).parentElement;
            if (!anchorParent) return;
            endOfContent.style.width = textLayerDiv.style.width;
            endOfContent.style.height = textLayerDiv.style.height;
            endOfContent.style.userSelect = 'text';
            anchorParent.insertBefore(endOfContent, modifyStart ? anchor : anchor.nextSibling);
          }

          prevRange = range.cloneRange();
        },
        { signal },
      );
    });
  }

  /**
   * pdfjs TextLayer appends a <canvas class="hiddenCanvasElement"> to document.body
   * for font measurements. It is never removed. Without hiding it, it adds to the
   * body's content height and can cause scrollbars.
   */
  private static hidePdfjsMeasurementCanvas() {
    document.querySelectorAll<HTMLElement>('body > .hiddenCanvasElement').forEach((el) => {
      el.style.position = 'absolute';
      el.style.width = '0';
      el.style.height = '0';
      el.style.overflow = 'hidden';
    });
  }

  private prepareCanvas(canvas: HTMLCanvasElement, viewport: PageViewport) {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const context = canvas.getContext('2d');
    if (context) {
      context.scale(dpr, dpr);
    }
  }

  private prepareViewport(
    page: PDFPageProxy,
    parentWidth: number,
    parentHeight: number,
    zoom: number,
    rotation = 0,
  ): PageViewport {
    const unscaledViewport = page.getViewport({ scale: 1, rotation });
    const scale = Math.min(parentWidth / unscaledViewport.width, parentHeight / unscaledViewport.height) * zoom;
    return page.getViewport({ scale, rotation });
  }

  private async destroyPdfJsWorker() {
    await this.loadingTask?.destroy();
  }

  private getAuthorizationHeader(): Record<string, string> {
    const accessToken = this.sessionStorageService.get('access_token');

    if (this.isViewApp() || !accessToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }
}
