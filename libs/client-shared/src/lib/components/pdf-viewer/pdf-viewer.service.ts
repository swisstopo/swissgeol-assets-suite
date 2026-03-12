import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  getDocument,
  GlobalWorkerOptions,
  PageViewport,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  TextLayer,
} from 'pdfjs-dist';
import { PDFPageProxy, TextContent } from 'pdfjs-dist/types/src/display/api';
import { SessionStorageService } from '../../services/session-storage.service';

// Worker source for PDF JS. Note that this must match the path that is defined in the builder configuration
GlobalWorkerOptions.workerSrc = 'assets/pdfjs/pdf.worker.min.mjs';

@Injectable()
export class PdfViewerService implements OnDestroy {
  private loadingTask: PDFDocumentLoadingTask | undefined;
  private pdfDoc: PDFDocumentProxy | undefined;
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly ngZone = inject(NgZone);
  private selectionAbortController: AbortController | null = null;

  async ngOnDestroy() {
    this.selectionAbortController?.abort();
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
      httpHeaders: {
        Authorization: `Bearer ${this.sessionStorageService.get('access_token')}`,
      },
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

  public async renderPageToCanvas(
    canvas: HTMLCanvasElement,
    textLayerDiv: HTMLElement,
    pageNum: number,
    parentWidth: number,
    parentHeight: number,
    zoom: number,
  ) {
    if (!this.pdfDoc) {
      throw new Error('PDF document not loaded');
    }

    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = this.prepareViewport(page, parentWidth, parentHeight, zoom);
    this.prepareCanvas(canvas, viewport);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2d context from canvas');
    }
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    await this.renderTextLayer(page, textLayerDiv, viewport);
  }

  private async renderTextLayer(page: PDFPageProxy, textLayerDiv: HTMLElement, viewport: PageViewport) {
    const textContent = await page.getTextContent({ disableNormalization: true });
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
   */
  private correctTextLayerScaleX(textLayer: TextLayer, textContent: TextContent, viewport: PageViewport) {
    const textDivs = textLayer.textDivs;
    const textItems = textContent.items.filter((item) => 'str' in item && 'width' in item);

    const savedTransforms: string[] = [];
    for (let i = 0; i < textDivs.length && i < textItems.length; i++) {
      savedTransforms.push(textDivs[i].style.transform);
      textDivs[i].style.transform = 'none';
    }

    const measurements: { span: HTMLElement; expectedCssWidth: number; naturalWidth: number }[] = [];
    for (let i = 0; i < textDivs.length && i < textItems.length; i++) {
      const item = textItems[i];
      if (!item.width || !textDivs[i].textContent) {
        continue;
      }
      measurements.push({
        span: textDivs[i],
        expectedCssWidth: item.width * viewport.scale,
        naturalWidth: textDivs[i].getBoundingClientRect().width,
      });
    }

    for (let i = 0; i < textDivs.length && i < textItems.length; i++) {
      textDivs[i].style.transform = savedTransforms[i];
    }
    for (const { span, expectedCssWidth, naturalWidth } of measurements) {
      if (naturalWidth > 0) {
        span.style.setProperty('--scale-x', (expectedCssWidth / naturalWidth).toString());
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
    // Abort previous listeners (from prior page renders) before setting up new ones.
    this.selectionAbortController?.abort();
    this.selectionAbortController = new AbortController();
    const { signal } = this.selectionAbortController;

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
            anchor = anchor.parentNode!;
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
            endOfContent.style.width = textLayerDiv.style.width;
            endOfContent.style.height = textLayerDiv.style.height;
            endOfContent.style.userSelect = 'text';
            (anchor as HTMLElement).parentElement!.insertBefore(
              endOfContent,
              modifyStart ? (anchor as Node) : (anchor as Node).nextSibling,
            );
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

  private prepareViewport(page: PDFPageProxy, parentWidth: number, parentHeight: number, zoom: number): PageViewport {
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(parentWidth / unscaledViewport.width, parentHeight / unscaledViewport.height) * zoom;

    return page.getViewport({ scale });
  }

  private async destroyPdfJsWorker() {
    await this.loadingTask?.destroy();
    await this.pdfDoc?.destroy();
  }
}
