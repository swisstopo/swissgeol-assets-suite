import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  output,
  Renderer2,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { AssetFile, AssetFileSignedUrl } from '@asset-sg/shared/v2';
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
import { PdfViewerTocComponent } from './pdf-viewer-toc/pdf-viewer-toc.component';
import { PdfViewerZoomComponent, PdfZoomAction } from './pdf-viewer-zoom/pdf-viewer-zoom.component';
import { PdfViewerService } from './pdf-viewer.service';

export type PdfViewerFile = Pick<AssetFile, 'id' | 'pageRangeClassifications'> & {
  fileName: string;
};

interface PageSlot {
  pageNum: number;
  nativeWidth: number;
  nativeHeight: number;
  displayWidth: number;
  displayHeight: number;
  canvas: HTMLCanvasElement | null;
  isRendering: boolean;
}

// data-attribute to identify the page number on the canvas elements
const DATA_PAGE_NUMBER_ID = 'data-pdf-page-number';
// Define a margin to ensure the PDF fits well within the container; as a percentage
const PDF_RENDERING_MARGIN = 0.95;
// Defines the maximum zoom level allowed
const MAX_ZOOM_LEVEL = 5;
// Defines the minimum zoom level allowed
const MIN_ZOOM_LEVEL = 1;
// Defines the zoom step increment/decrement
const ZOOM_STEP = 0.5;
// Number of pages to prefetch around visible pages
const PREFETCH_BUFFER = 2;

@Component({
  selector: 'asset-sg-pdf-viewer',
  imports: [
    CommonModule,
    MatProgressBar,
    PdfViewerNavigationComponent,
    PdfViewerZoomComponent,
    PdfViewerRotateComponent,
    PdfViewerHeaderComponent,
    PdfViewerTocComponent,
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
  protected readonly pageSlots = signal<PageSlot[]>([]);
  protected readonly maxZoomLevel = MAX_ZOOM_LEVEL;
  protected readonly minZoomLevel = MIN_ZOOM_LEVEL;
  protected readonly pdfViewerService = inject(PdfViewerService);

  private readonly pdfElement = viewChild.required<ElementRef<HTMLDivElement>>('pdf');
  private readonly renderer = inject(Renderer2);
  private readonly store = inject(Store);
  private readonly translateService = inject(TranslateService);
  private readonly httpClient = inject(HttpClient);
  private readonly ngZone = inject(NgZone);

  private rotation = 0;
  private intersectionObserver: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private visiblePages = new Set<number>();
  private renderDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.setupInitialPdfEffect();
    this.setupRenderingEffect();
    this.setupAssetPdfChangeEffect();
  }

  public ngOnDestroy() {
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }
  }

  protected closeViewer() {
    this.exitViewer.emit();
  }

  protected navigateToPage(pageNum: number) {
    if (pageNum >= 1 && pageNum <= this.pageCount()) {
      this.scrollToPage(pageNum);
    }
  }

  protected handleNavigation($event: PdfNavigationAction) {
    switch ($event) {
      case 'next':
        this.navigateToPage(this.currentPage() + 1);
        break;
      case 'previous':
        this.navigateToPage(this.currentPage() - 1);
        break;
      case 'start':
        this.navigateToPage(1);
        break;
      case 'end':
        this.navigateToPage(this.pageCount());
        break;
    }
  }

  protected async handleRotation() {
    this.rotation = (this.rotation + 90) % 360;

    const scrollContainer = this.pdfElement().nativeElement;
    const scrollRatio = scrollContainer.scrollHeight > 0 ? scrollContainer.scrollTop / scrollContainer.scrollHeight : 0;

    await this.clearAndRerender(scrollContainer, scrollRatio);
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

    const scrollContainer = this.pdfElement().nativeElement;
    const scrollRatio = scrollContainer.scrollHeight > 0 ? scrollContainer.scrollTop / scrollContainer.scrollHeight : 0;

    await this.clearAndRerender(scrollContainer, scrollRatio);
  }

  private async clearAndRerender(scrollContainer: HTMLElement, scrollRatio: number) {
    this.clearAllCanvases();
    this.recalculateSlotDimensions();

    await this.waitForDom();
    scrollContainer.scrollTop = scrollRatio * scrollContainer.scrollHeight;
    this.renderVisiblePages();
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

  private setupAssetPdfChangeEffect() {
    effect(() => {
      const selectedPdf = untracked(() => this.selectedPdf());

      if (selectedPdf) {
        if (!this.assetPdfs().some((f) => f.id == selectedPdf.id && f.fileName === selectedPdf.fileName)) {
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

  private setupRenderingEffect() {
    let isFirstRun = true;

    effect(async () => {
      const selectedPdf = this.selectedPdf();
      if (this.pdfElement() && selectedPdf) {
        await this.loadPdf(selectedPdf.id, isFirstRun ? this.initialPageNumber() : 1);
        isFirstRun = false;
      }
    });
  }

  private async loadPdf(pdfId: number, initialPage = 1) {
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.visiblePages.clear();
    this.pageSlots.set([]);
    this.isRendering.set(true);
    this.hasError.set(false);
    this.pageCount.set(-1);
    this.currentPage.set(-1);

    try {
      const numPages = await this.pdfViewerService.loadPdf(this.assetId(), pdfId);
      this.pageCount.set(numPages);

      const containerWidth = this.pdfElement().nativeElement.clientWidth * PDF_RENDERING_MARGIN;
      const containerHeight = this.pdfElement().nativeElement.clientHeight;

      // Only fetch dimensions for page 1 — use as estimate for all pages.
      // Actual dimensions are corrected lazily when each page is rendered.
      const { width, height } = await this.pdfViewerService.getPageDimensions(1);
      const { displayWidth, displayHeight } = this.computeDisplayDimensions(
        width,
        height,
        containerWidth,
        containerHeight,
      );

      const slots: PageSlot[] = [];
      for (let i = 1; i <= numPages; i++) {
        slots.push({
          pageNum: i,
          nativeWidth: width,
          nativeHeight: height,
          displayWidth,
          displayHeight,
          canvas: null,
          isRendering: false,
        });
      }
      this.pageSlots.set(slots);
      this.isRendering.set(false);

      // Wait for DOM to render slots, then set up observers and scroll
      await this.waitForDom();
      this.initializeIntersectionObserver();
      this.initializeResizeObserver();

      if (initialPage && initialPage > 1) {
        this.scrollToPage(initialPage);
      }
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

  private initializeIntersectionObserver() {
    this.intersectionObserver?.disconnect();
    const scrollContainer = this.pdfElement().nativeElement;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => this.ngZone.run(() => this.handleIntersection(entries)),
      {
        root: scrollContainer,
        rootMargin: '200% 0px',
        threshold: [0, 0.5],
      },
    );

    const slots = scrollContainer.querySelectorAll('.page-slot');
    slots.forEach((slot) => this.intersectionObserver!.observe(slot));
  }

  private initializeResizeObserver() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        const scrollToPage = this.currentPage();
        this.clearAllCanvases();
        this.recalculateSlotDimensions();
        if (scrollToPage > 0) {
          this.scrollToPage(scrollToPage);
        }
      });
    });
    this.resizeObserver.observe(this.pdfElement().nativeElement);
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      const pageNum = parseInt(entry.target.getAttribute('data-page-num')!, 10);
      if (entry.isIntersecting) {
        this.visiblePages.add(pageNum);
      } else {
        this.visiblePages.delete(pageNum);
      }
    }

    this.updateCurrentPage();
    this.scheduleRender();
  }

  private scheduleRender() {
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }
    this.renderDebounceTimer = setTimeout(() => {
      this.renderDebounceTimer = null;
      this.ngZone.run(() => this.renderVisiblePages());
    }, 150);
  }

  private renderVisiblePages() {
    const pagesToRender = this.getPagesToRender();

    for (const pageNum of pagesToRender) {
      const slot = this.pageSlots()[pageNum - 1];
      if (slot && !slot.canvas && !slot.isRendering) {
        this.renderPageSlot(pageNum);
      }
    }

    this.evictDistantPages(pagesToRender);
  }

  private updateCurrentPage() {
    if (this.visiblePages.size === 0) {
      return;
    }

    const scrollContainer = this.pdfElement().nativeElement;
    const containerRect = scrollContainer.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    let closestDistance = Infinity;
    let closestPage = this.currentPage();

    for (const pageNum of this.visiblePages) {
      const slotElement = scrollContainer.querySelector(`.page-slot[data-page-num="${pageNum}"]`);
      if (slotElement) {
        const rect = slotElement.getBoundingClientRect();
        const slotCenter = rect.top + rect.height / 2;
        const distance = Math.abs(slotCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = pageNum;
        }
      }
    }

    if (closestPage !== this.currentPage()) {
      this.currentPage.set(closestPage);
    }
  }

  private getPagesToRender(): Set<number> {
    const result = new Set<number>();
    for (const pageNum of this.visiblePages) {
      for (let offset = -PREFETCH_BUFFER; offset <= PREFETCH_BUFFER; offset++) {
        const p = pageNum + offset;
        if (p >= 1 && p <= this.pageCount()) {
          result.add(p);
        }
      }
    }
    return result;
  }

  private async renderPageSlot(pageNum: number) {
    this.updateSlot(pageNum, { isRendering: true });

    const slotElement = this.pdfElement().nativeElement.querySelector(
      `.page-slot[data-page-num="${pageNum}"]`,
    ) as HTMLElement;
    if (!slotElement) {
      return;
    }

    const canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
    this.renderer.setAttribute(canvas, DATA_PAGE_NUMBER_ID, pageNum.toString());

    const containerWidth = this.pdfElement().nativeElement.clientWidth * PDF_RENDERING_MARGIN;
    const containerHeight = this.pdfElement().nativeElement.clientHeight;
    const slot = this.pageSlots()[pageNum - 1];

    try {
      const { nativeWidth, nativeHeight } = await this.pdfViewerService.renderPageToCanvas(
        canvas,
        pageNum,
        slot.displayWidth,
        slot.displayHeight,
        1,
        this.rotation,
      );
      // Check if slot was cleared (e.g., by zoom) while we were rendering
      if (this.pageSlots()[pageNum - 1]?.isRendering) {
        this.renderer.appendChild(slotElement, canvas);
        // Correct slot dimensions with actual page size
        const { displayWidth, displayHeight } = this.computeDisplayDimensions(
          nativeWidth,
          nativeHeight,
          containerWidth,
          containerHeight,
        );
        const oldDisplayHeight = this.pageSlots()[pageNum - 1].displayHeight;
        this.updateSlot(pageNum, {
          canvas,
          isRendering: false,
          nativeWidth,
          nativeHeight,
          displayWidth,
          displayHeight,
        });
        this.compensateScrollPosition(slotElement, displayHeight - oldDisplayHeight);
      }
    } catch (e) {
      console.error(`Failed to render page ${pageNum}`, e);
      this.updateSlot(pageNum, { isRendering: false });
    }
  }

  private evictDistantPages(pagesToKeep: Set<number>) {
    const slots = this.pageSlots();
    for (const slot of slots) {
      if (slot.canvas && !pagesToKeep.has(slot.pageNum)) {
        this.evictPage(slot.pageNum);
      }
    }
  }

  private evictPage(pageNum: number) {
    const slot = this.pageSlots()[pageNum - 1];
    if (!slot?.canvas) {
      return;
    }

    const slotElement = this.pdfElement().nativeElement.querySelector(`.page-slot[data-page-num="${pageNum}"]`);
    if (slotElement) {
      this.renderer.removeChild(slotElement, slot.canvas);
    }
    this.updateSlot(pageNum, { canvas: null });
  }

  private clearAllCanvases() {
    const slots = this.pageSlots();
    for (const slot of slots) {
      if (slot.canvas) {
        const slotElement = this.pdfElement().nativeElement.querySelector(
          `.page-slot[data-page-num="${slot.pageNum}"]`,
        );
        if (slotElement) {
          this.renderer.removeChild(slotElement, slot.canvas);
        }
      }
    }
    this.pageSlots.update((s) =>
      s.map((slot) => ({
        ...slot,
        canvas: null,
        isRendering: false,
      })),
    );
  }

  private recalculateSlotDimensions() {
    const containerWidth = this.pdfElement().nativeElement.clientWidth * PDF_RENDERING_MARGIN;
    const containerHeight = this.pdfElement().nativeElement.clientHeight;

    this.pageSlots.update((slots) =>
      slots.map((slot) => {
        const { displayWidth, displayHeight } = this.computeDisplayDimensions(
          slot.nativeWidth,
          slot.nativeHeight,
          containerWidth,
          containerHeight,
        );
        return { ...slot, displayWidth, displayHeight };
      }),
    );
  }

  /**
   * Computes display dimensions using a uniform scale that stays consistent across all rotations.
   * This prevents the page from appearing larger/smaller when rotating 90°/270°.
   * Scale = min(containerWidth, containerHeight) / max(nativeWidth, nativeHeight)
   */
  private computeDisplayDimensions(
    nativeWidth: number,
    nativeHeight: number,
    containerWidth: number,
    containerHeight: number,
  ): { displayWidth: number; displayHeight: number } {
    const isSwapped = this.rotation === 90 || this.rotation === 270;
    const visualWidth = isSwapped ? nativeHeight : nativeWidth;
    const visualHeight = isSwapped ? nativeWidth : nativeHeight;
    const maxNative = Math.max(nativeWidth, nativeHeight);
    const scale = Math.min(containerWidth / maxNative, containerHeight / maxNative) * this.zoom();
    return {
      displayWidth: visualWidth * scale,
      displayHeight: visualHeight * scale,
    };
  }

  /**
   * If a slot above the current scroll position changes height, adjust scrollTop
   * by the delta so the visible content doesn't jump.
   */
  private compensateScrollPosition(slotElement: HTMLElement, heightDelta: number) {
    if (heightDelta === 0) {
      return;
    }
    const scrollContainer = this.pdfElement().nativeElement;
    const slotTop = slotElement.offsetTop;
    if (slotTop < scrollContainer.scrollTop) {
      scrollContainer.scrollTop += heightDelta;
    }
  }

  private scrollToPage(pageNum: number) {
    const slotElement = this.pdfElement().nativeElement.querySelector(`.page-slot[data-page-num="${pageNum}"]`);
    if (slotElement) {
      slotElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private updateSlot(pageNum: number, updates: Partial<PageSlot>) {
    this.pageSlots.update((slots) => {
      const updated = [...slots];
      updated[pageNum - 1] = { ...updated[pageNum - 1], ...updates };
      return updated;
    });
  }

  private waitForDom(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }
}
