import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  Renderer2,
  signal,
  ViewChild,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { showAlert } from '../../state/alert/alert.actions';
import { AlertType } from '../../state/alert/alert.model';
import {
  PdfNavigationAction,
  PdfViewerNavigationComponent,
} from './pdf-viewer-navigation/pdf-viewer-navigation.component';
import { PdfViewerRotateComponent } from './pdf-viewer-rotate/pdf-viewer-rotate.component';
import { PdfViewerZoomComponent, PdfZoomAction } from './pdf-viewer-zoom/pdf-viewer-zoom.component';
import { PdfViewerService } from './pdf-viewer.service';

// data-attribute to identify the page number on the canvas elements
const DATA_PAGE_NUMBER_ID = 'data-pdf-page-number';
// data-attribute to identify the rotation of the canvas elements
const DATA_PAGE_ROTATION_ID = 'data-pdf-page-rotation';
// Define a margin to ensure the PDF fits well within the container; as a percentage
const PDF_RENDERING_MARGIN = 0.95;
// Defines the maximum zoom level allowed
const MAX_ZOOM_LEVEL = 5.0;
// Defines the minimum zoom level allowed
const MIN_ZOOM_LEVEL = 1.0;
// Defines the zoom step increment/decrement
const ZOOM_STEP = 0.5;

@Component({
  selector: 'asset-sg-pdf-viewer',
  imports: [
    CommonModule,
    MatProgressBar,
    PdfViewerNavigationComponent,
    PdfViewerZoomComponent,
    PdfViewerRotateComponent,
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss',
  providers: [PdfViewerService],
})
export class PdfViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pdf') public pdfElement!: ElementRef<HTMLDivElement>;
  @Input({ required: true }) public pdfId!: number;
  @Input({ required: true }) public assetId!: number;
  protected readonly currentPage = signal(-1);
  protected readonly hasError = signal(false);
  protected readonly pageCount = signal(-1);
  protected readonly isRendering = signal(true);
  protected readonly pdfViewerService = inject(PdfViewerService);
  private resizeObserver!: ResizeObserver;
  private readonly renderer = inject(Renderer2);
  private readonly pdfCanvasElements: Map<number, HTMLCanvasElement> = new Map();
  private readonly store = inject(Store);
  private readonly translateService = inject(TranslateService);
  private rotation = 0;
  protected readonly zoom = signal(1);
  protected readonly isZoomed = computed(() => this.zoom() !== 1);
  protected readonly maxZoomLevel = MAX_ZOOM_LEVEL;
  protected readonly minZoomLevel = MIN_ZOOM_LEVEL;

  public async ngAfterViewInit() {
    try {
      const pageNum = await this.pdfViewerService.loadPdf(this.assetId, this.pdfId);
      this.pageCount.set(pageNum);
      await this.renderPage(1);
    } catch (e) {
      this.hasError.set(true);
      this.store.dispatch(
        showAlert({
          alert: {
            id: `pdf-error-${this.assetId}-${this.pdfId}`,
            text: this.translateService.instant('downloadFailed'),
            type: AlertType.Error,
            isPersistent: true,
          },
        }),
      );
      throw e;
    }
  }

  public async ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  protected async navigateToPage(pageNum: number) {
    if (pageNum > 0 && pageNum <= this.pageCount()) {
      await this.renderPage(pageNum);
    }
  }

  protected async handleNavigation($event: PdfNavigationAction) {
    switch ($event) {
      case 'next':
        await this.navigateToPage(this.currentPage() + 1);
        break;
      case 'previous':
        await this.navigateToPage(this.currentPage() - 1);
        break;
      case 'start':
        await this.navigateToPage(1);
        break;
      case 'end':
        await this.navigateToPage(this.pageCount());
        break;
    }
  }

  protected handleRotation() {
    this.rotation = (this.rotation + 90) % 360;
    for (const canvas of this.pdfCanvasElements.values()) {
      this.renderer.setAttribute(canvas, DATA_PAGE_ROTATION_ID, this.rotation.toString());
    }
  }

  private async renderPage(pageNum: number) {
    for (const canvas of this.pdfCanvasElements.values()) {
      this.renderer.setStyle(canvas, 'display', 'none');
    }

    if (!this.useCachedPageIfExists(pageNum)) {
      await this.renderPageAndCache(pageNum);
    }

    this.currentPage.set(pageNum);
  }

  private useCachedPageIfExists(pageNum: number): boolean {
    const existingPage = this.pdfCanvasElements.get(pageNum);
    if (existingPage) {
      this.renderer.setStyle(existingPage, 'display', 'block');
      return true;
    }

    return false;
  }

  private clearCanvases() {
    for (const canvas of this.pdfCanvasElements.values()) {
      this.renderer.setStyle(canvas, 'display', 'none');
      this.renderer.removeChild(this.pdfElement.nativeElement, canvas);
    }
    this.pdfCanvasElements.clear();
  }

  private createCanvasPlaceholder(pageNum: number): HTMLCanvasElement {
    const canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
    this.renderer.setAttribute(canvas, DATA_PAGE_NUMBER_ID, pageNum.toString());
    this.renderer.setAttribute(canvas, DATA_PAGE_ROTATION_ID, this.rotation.toString());
    this.renderer.appendChild(this.pdfElement.nativeElement, canvas);

    return canvas;
  }

  private async renderPageAndCache(pageNum: number) {
    this.isRendering.set(true);
    const parentWidth = this.pdfElement.nativeElement.clientWidth * PDF_RENDERING_MARGIN;
    const parentHeight = this.pdfElement.nativeElement.clientHeight * PDF_RENDERING_MARGIN;
    const canvas = this.createCanvasPlaceholder(pageNum);
    await this.pdfViewerService.renderPageToCanvas(canvas, pageNum, parentWidth, parentHeight, this.zoom());
    this.pdfCanvasElements.set(pageNum, canvas);
    this.isRendering.set(false);
  }

  protected async handleZoom($event: PdfZoomAction) {
    switch ($event) {
      case 'in':
        this.zoom.update((val) => Math.min(MAX_ZOOM_LEVEL, val + ZOOM_STEP));
        break;
      case 'out':
        this.zoom.update((val) => Math.max(MIN_ZOOM_LEVEL, val - ZOOM_STEP));
        break;
      case 'reset':
        this.zoom.set(1);
        break;
    }
    this.clearCanvases();
    await this.renderPage(this.currentPage());
  }
}
