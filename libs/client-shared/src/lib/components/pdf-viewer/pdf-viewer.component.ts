import { DragDrop, DragRef } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  Renderer2,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { AssetFileSignedUrl } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { showAlert } from '../../state/alert/alert.actions';
import { AlertType } from '../../state/alert/alert.model';
import { triggerDownload } from '../../utils';
import { PdfViewerHeaderComponent } from './pdf-viewer-header/pdf-viewer-header.component';
import {
  PdfNavigationAction,
  PdfViewerNavigationComponent,
} from './pdf-viewer-navigation/pdf-viewer-navigation.component';
import { PdfViewerRotateComponent } from './pdf-viewer-rotate/pdf-viewer-rotate.component';
import { PdfViewerZoomComponent, PdfZoomAction } from './pdf-viewer-zoom/pdf-viewer-zoom.component';
import { PdfViewerService } from './pdf-viewer.service';

type PdfPageWrapperCenter = {
  x: number;
  y: number;
};

export type PdfViewerFile = {
  id: number;
  fileName: string;
};

// data-attribute to identify the page number on the canvas elements
const DATA_PAGE_NUMBER_ID = 'data-pdf-page-number';
// data-attribute to identify the rotation of the canvas elements
const DATA_PAGE_ROTATION_ID = 'data-pdf-page-rotation';
// Define a margin to ensure the PDF fits well within the container; as a percentage
const PDF_RENDERING_MARGIN = 0.95;
// Defines the maximum zoom level allowed
const MAX_ZOOM_LEVEL = 5;
// Defines the minimum zoom level allowed
const MIN_ZOOM_LEVEL = 1;
// Defines the zoom step increment/decrement
const ZOOM_STEP = 0.5;

/**
 * Component to display a PDF using the PdfJsLibrary. Uses a caching mechanism to store rendered pages in their
 * canvas to optimize performance when navigating between pages. This could leak memory if a large PDF is opened and
 * in that case, we could simplify the whole approach by only rendering one page at a time, without injecting the
 * canvas on the fly programmatically.
 */
@Component({
  selector: 'asset-sg-pdf-viewer',
  imports: [
    CommonModule,
    MatProgressBar,
    PdfViewerNavigationComponent,
    PdfViewerZoomComponent,
    PdfViewerRotateComponent,
    PdfViewerHeaderComponent,
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss',
  providers: [PdfViewerService],
})
export class PdfViewerComponent implements OnDestroy {
  public readonly hideHeader = input(false);
  public readonly hideCloseButton = input(false);
  public readonly hideDownloadButton = input(false);
  public readonly hidePdfSelection = input(false);
  public readonly assetId = input.required<number>();
  public readonly assetPdfs = input.required<PdfViewerFile[]>();
  public readonly initialPdfId = input<number>();
  public readonly initialPageNumber = input<number>();
  public readonly exitViewer = output();
  protected readonly currentPage = signal(-1);
  protected readonly hasError = signal(false);
  protected readonly pageCount = signal(-1);
  protected readonly isRendering = signal(true);
  protected readonly zoom = signal(1);
  protected readonly isZoomed = computed(() => this.zoom() !== 1);
  protected readonly selectedPdf = signal<PdfViewerFile | undefined>(undefined);
  protected readonly pdfViewerService = inject(PdfViewerService);
  protected readonly maxZoomLevel = MAX_ZOOM_LEVEL;
  protected readonly minZoomLevel = MIN_ZOOM_LEVEL;
  private readonly pdfElement = viewChild.required<ElementRef<HTMLDivElement>>('pdf');
  private readonly renderer = inject(Renderer2);
  private readonly pdfCanvasElements: Map<number, HTMLCanvasElement> = new Map();
  private readonly store = inject(Store);
  private readonly translateService = inject(TranslateService);
  private rotation = 0;
  private readonly cdkDragHandler = inject(DragDrop);
  private readonly dragHandlers: Set<DragRef> = new Set();
  private readonly httpClient = inject(HttpClient);

  constructor() {
    this.setupInitialPdfEffect();
    this.setupRenderingEffect();
    this.setupAssetPdfChangeEffect();
  }

  public async ngOnDestroy() {
    for (const dragHandler of this.dragHandlers) {
      dragHandler.dispose();
    }
  }

  protected closeViewer() {
    this.exitViewer.emit();
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

  protected async handleZoom($event: PdfZoomAction) {
    let currentCenter: PdfPageWrapperCenter | undefined = undefined;
    switch ($event) {
      case 'in':
        this.zoom.update((val) => Math.min(MAX_ZOOM_LEVEL, val + ZOOM_STEP));
        currentCenter = this.getCurrentPageCenter();
        break;
      case 'out':
        this.zoom.update((val) => Math.max(MIN_ZOOM_LEVEL, val - ZOOM_STEP));
        currentCenter = this.getCurrentPageCenter();
        break;
      case 'reset':
        this.zoom.set(1);
        break;
    }

    this.clearCanvases();
    await this.renderPage(this.currentPage(), currentCenter);
  }

  protected onCloseViewer() {
    this.closeViewer();
  }

  protected downloadPdf() {
    this.httpClient
      .get<AssetFileSignedUrl>(`/api/assets/${this.assetId()}/files/${this.selectedPdf()?.id}/presigned?download=true`)
      .subscribe(({ url }) => {
        triggerDownload(url, true);
      });
  }

  /**
   * Effect that runs once to set the initial PDF once the assetPdfs are available. If no initialPdfId is provided, the
   * first PDF in the list is selected.
   */
  private setupInitialPdfEffect() {
    const effectRef = effect(
      () => {
        if (this.assetPdfs().length > 0) {
          let initialPdf: PdfViewerFile | undefined;
          const initialPdfId = this.initialPdfId();
          if (initialPdfId) {
            initialPdf = this.assetPdfs().find((pdf) => pdf.id === initialPdfId);
          }
          this.selectedPdf.set(initialPdf ?? this.assetPdfs()[0]);
          effectRef.destroy();
        }
      },
      { manualCleanup: true },
    );
  }

  /**
   * Because the list of assetPdfs could change while the viewer is open, we need to ensure that the selected PDF is
   * still valid. If not, we reset it to the first available PDF.
   */
  private setupAssetPdfChangeEffect() {
    effect(() => {
      const selectedPdf = untracked(() => this.selectedPdf());

      if (selectedPdf) {
        if (!this.assetPdfs().find((f) => f.id == selectedPdf.id && f.fileName === selectedPdf.fileName)) {
          this.selectedPdf.set(this.assetPdfs()[0]);

          this.store.dispatch(
            showAlert({
              alert: {
                id: `pdf-notice-${this.assetId}-${this.selectedPdf()?.id}`,
                text: this.translateService.instant('pdfNoLongerAvailable'),
                type: AlertType.Warning,
                isPersistent: false,
              },
            }),
          );
        }
      }
    });
  }

  /**
   * Effect that triggers PDF loading and rendering whenever the selected PDF changes. This also handles the initial
   * load, since it only runs as soon as the pdfElement is available.
   */
  private setupRenderingEffect() {
    effect(async () => {
      const selectedPdf = this.selectedPdf();
      if (this.pdfElement() && selectedPdf) {
        await this.loadPdf(selectedPdf.id);
      }
    });
  }

  private async loadPdf(pdfId: number) {
    this.clearCanvases();
    this.isRendering.set(true);
    this.hasError.set(false);
    try {
      const pageNum = await this.pdfViewerService.loadPdf(this.assetId(), pdfId);
      this.pageCount.set(pageNum);
      await this.renderPage(this.initialPageNumber() ?? 1);
    } catch (e) {
      this.hasError.set(true);
      this.store.dispatch(
        showAlert({
          alert: {
            id: `pdf-error-${this.assetId}-${this.selectedPdf()?.id}`,
            text: this.translateService.instant('downloadFailed'),
            type: AlertType.Error,
            isPersistent: true,
          },
        }),
      );
      throw e;
    }
  }

  private getCurrentPageCenter(): PdfPageWrapperCenter | undefined {
    const canvas = this.pdfCanvasElements.get(this.currentPage());
    if (!canvas?.parentElement) {
      return undefined;
    }

    const currentPageRect = canvas.parentElement.getBoundingClientRect();
    const x = currentPageRect.left + currentPageRect.width / 2;
    const y = currentPageRect.top + currentPageRect.height / 2;
    return { x, y };
  }

  private async renderPage(pageNum: number, center?: PdfPageWrapperCenter) {
    for (const canvas of this.pdfCanvasElements.values()) {
      this.renderer.setStyle(canvas.parentElement, 'display', 'none');
    }

    if (!this.useCachedPageIfExists(pageNum)) {
      await this.renderPageAndCache(pageNum, center);
    }

    this.currentPage.set(pageNum);
  }

  private useCachedPageIfExists(pageNum: number): boolean {
    const existingPage = this.pdfCanvasElements.get(pageNum);
    if (existingPage) {
      this.renderer.setStyle(existingPage.parentElement, 'display', 'block');
      return true;
    }

    return false;
  }

  private clearCanvases() {
    for (const canvas of this.pdfCanvasElements.values()) {
      this.renderer.setStyle(canvas.parentElement, 'display', 'none');
      this.renderer.removeChild(this.pdfElement().nativeElement, canvas.parentElement);
    }
    this.pdfCanvasElements.clear();
  }

  /**
   * Creates a canvas placeholder for the given page number and appends it to the PDF container. If a center is
   * provided, the canvas wrapper is positioned absolutely at that center, which is useful for zooming operations to
   * ensure the zoom focuses on the right area.
   */
  private createCanvasPlaceholder(pageNum: number, center?: PdfPageWrapperCenter): HTMLCanvasElement {
    const canvasWrapper = this.renderer.createElement('div');
    this.renderer.addClass(canvasWrapper, 'canvas-wrapper');
    if (center) {
      const pageCenterX = center.x - this.pdfElement().nativeElement.getBoundingClientRect().left;
      const pageCenterY = center.y - this.pdfElement().nativeElement.getBoundingClientRect().top;
      this.renderer.setStyle(canvasWrapper, 'position', 'absolute');
      this.renderer.setStyle(canvasWrapper, 'left', `${pageCenterX}px`);
      this.renderer.setStyle(canvasWrapper, 'top', `${pageCenterY}px`);
      this.renderer.setStyle(canvasWrapper, 'transform', 'translate(-50%, -50%)');
    }

    const canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
    this.renderer.setAttribute(canvas, DATA_PAGE_NUMBER_ID, pageNum.toString());
    this.renderer.setAttribute(canvas, DATA_PAGE_ROTATION_ID, this.rotation.toString());
    this.renderer.appendChild(canvasWrapper, canvas);
    this.renderer.appendChild(this.pdfElement().nativeElement, canvasWrapper);

    const dragHandler = this.cdkDragHandler.createDrag(canvasWrapper);
    this.dragHandlers.add(dragHandler);
    return canvas;
  }

  private async renderPageAndCache(pageNum: number, center?: PdfPageWrapperCenter) {
    this.isRendering.set(true);
    const parentWidth = this.pdfElement().nativeElement.clientWidth * PDF_RENDERING_MARGIN;
    const parentHeight = this.pdfElement().nativeElement.clientHeight * PDF_RENDERING_MARGIN;
    const canvas = this.createCanvasPlaceholder(pageNum, center);
    await this.pdfViewerService.renderPageToCanvas(canvas, pageNum, parentWidth, parentHeight, this.zoom());
    this.pdfCanvasElements.set(pageNum, canvas);
    this.isRendering.set(false);
  }
}
