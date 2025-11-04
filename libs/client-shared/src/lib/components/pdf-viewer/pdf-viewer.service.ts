import { inject, Injectable, OnDestroy } from '@angular/core';
import { getDocument, GlobalWorkerOptions, PageViewport, PDFDocumentProxy } from 'pdfjs-dist';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { SessionStorageService } from '../../services/session-storage.service';

// Worker source for PDF JS. Note that this must match the path that is defined in the builder configuration
GlobalWorkerOptions.workerSrc = 'assets/pdfjs/pdf.worker.min.mjs';

@Injectable()
export class PdfViewerService implements OnDestroy {
  private pdfDoc: PDFDocumentProxy | undefined;
  private readonly sessionStorageService = inject(SessionStorageService);

  async ngOnDestroy() {
    await this.pdfDoc?.destroy();
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
    const loadingTask = getDocument({
      url: `/api/assets/${assetId}/files/${pdfId}`,
      httpHeaders: {
        Authorization: `Bearer ${this.sessionStorageService.get('access_token')}`,
      },
      disableAutoFetch: true,
      disableStream: true,
    });
    try {
      this.pdfDoc = await loadingTask.promise;
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
  }

  private prepareCanvas(canvas: HTMLCanvasElement, viewport: PageViewport) {
    canvas.width = viewport.width;
    canvas.height = viewport.height;
  }

  private prepareViewport(page: PDFPageProxy, parentWidth: number, parentHeight: number, zoom: number): PageViewport {
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(parentWidth / unscaledViewport.width, parentHeight / unscaledViewport.height) * zoom;

    return page.getViewport({ scale });
  }
}
