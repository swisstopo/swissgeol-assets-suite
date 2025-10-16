import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, signal, ViewChild } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
// tell PDF.js where the worker is
pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.mjs';

// to test: http://localhost:4200/de/asset-admin/44455/contacts
@Component({
  selector: 'asset-sg-custom-pdf-viewer',
  imports: [CommonModule],
  templateUrl: './custom-pdf-viewer.component.html',
  styleUrl: './custom-pdf-viewer.component.scss',
})
export class CustomPdfViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pdf') pdfElement!: ElementRef<HTMLDivElement>;
  private pdfDoc!: PDFDocumentProxy;
  protected currentPage = signal(1);
  protected isRendering = signal(true);

  async ngAfterViewInit() {
    await this.loadPartial();
  }

  async ngOnDestroy() {
    await this.pdfDoc.destroy();
  }
  private async loadPartial() {
    // Open the PDF incrementally
    // warning: some pdfs do not work with this approach, and will be loaded _fully_
    const loadingTask = pdfjsLib.getDocument({
      url: '/api/assets/44455/files/15136',
      httpHeaders: {
        Authorization: 'Impersonate admin@assets.swissgeol.ch',
      },
      disableAutoFetch: true,
      disableStream: true, // if we disable this, the whole file is loaded in the background
      rangeChunkSize: 65530,
    });
    try {
      this.pdfDoc = await loadingTask.promise;

      await this.renderPage(1);
    } catch (e) {
      /**
       * UnknownErrorException {message: 'Array buffer allocation failed', name: 'UnknownErrorException', details: 'RangeError: Array buffer allocation failed', stack: 'Error\n    at BaseExceptionClosure (http://localhos…oke (http://localhost:4200/polyfills.js:3135:158)'}
       */
      console.log("PDF KILLED THE PAGE", e)
    }

  }

  private async renderPage(pageNum: number) {
    this.isRendering.set(true);
    //<!-- todo: how does this all work? :) -->
    // check for existing canvases
    const elements = document.querySelectorAll(`[data-page-number="${pageNum}"]`);
    document.querySelectorAll('[data-page-number]').forEach((e) => e.setAttribute('style', 'display: none;'));

    if (elements.length > 0) {
      elements[0].setAttribute('style', 'display: block;');
      console.log('already rendered page ', pageNum);
      this.isRendering.set(false);

      return;
    }
    const page = await this.pdfDoc!.getPage(pageNum);

    const parentWidth = this.pdfElement.nativeElement.clientWidth;
    const parentHeight = this.pdfElement.nativeElement.clientHeight;

    // Use 95% of the available space to leave a margin
    const fitWidth = parentWidth * 0.95;
    const fitHeight = parentHeight * 0.95;

    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(fitWidth / unscaledViewport.width, fitHeight / unscaledViewport.height);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-page-number', pageNum.toString());
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport, canvas }).promise;
    this.pdfElement.nativeElement.appendChild(canvas);
    this.isRendering.set(false)
  }

  protected async flipPage(backward = false) {
    // we also need to disable flipping, depending on how we implement the canvas caching
    if (backward) {
      if (this.currentPage() > 1) {
        this.currentPage.set(this.currentPage() - 1);
        await this.renderPage(this.currentPage());
      }
      return;
    }
    if (this.currentPage() < this.pdfDoc.numPages) {
      this.currentPage.set(this.currentPage() + 1);
      await this.renderPage(this.currentPage());
    }
  }
}
