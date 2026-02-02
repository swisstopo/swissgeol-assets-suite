import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { Component, computed, input, output, signal } from '@angular/core';
import { extractGroupedPageRageClassifications, PageRangeClassification } from '@asset-sg/shared/v2';
import { TranslatePipe } from '@ngx-translate/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

@Component({
  selector: 'asset-sg-pdf-viewer-toc',
  imports: [SgcButton, SgcIcon, TranslatePipe, CdkAccordion, CdkAccordionItem],
  templateUrl: './pdf-viewer-toc.component.html',
  styleUrl: './pdf-viewer-toc.component.scss',
})
export class PdfViewerTocComponent {
  public readonly isRendering = input.required<boolean>();
  public readonly currentPage = input.required<number>();
  public readonly pageRangeClassifications = input.required<PageRangeClassification[]>();
  public readonly changePageEvent = output<number>();
  protected readonly showToc = signal(false);
  protected readonly groupedPageClassifications = computed(() =>
    extractGroupedPageRageClassifications(this.pageRangeClassifications()),
  );

  protected toggleToc(): void {
    this.showToc.update((value) => !value);
  }

  protected goToPage(pageNumber: number): void {
    this.changePageEvent.emit(pageNumber);
  }
}
