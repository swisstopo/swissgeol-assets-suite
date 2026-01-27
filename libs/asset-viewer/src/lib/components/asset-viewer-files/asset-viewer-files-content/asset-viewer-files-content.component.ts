import { Component, computed, input, output } from '@angular/core';
import { extractGroupedPageRageClassifications, LegalDocCode, PageRangeClassification } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-asset-viewer-files-content',
  templateUrl: './asset-viewer-files-content.component.html',
  styleUrls: ['./asset-viewer-files-content.component.scss'],
  standalone: false,
})
export class AssetViewerFilesContentComponent {
  public readonly pageCount = input.required<number | null>();
  public readonly legalDocCode = input.required<LegalDocCode | null>();
  public readonly pageRangeClassifications = input.required<PageRangeClassification[]>();
  public readonly openOnPage = output<number>();
  protected readonly groupedPageClassifications = computed(() =>
    extractGroupedPageRageClassifications(this.pageRangeClassifications()),
  );
  protected readonly pageCategories = computed(() => {
    return this.groupedPageClassifications().groupedPageClassifications.map((f) => f.category);
  });

  protected openPdfOnPage(pageNumber: number): void {
    this.openOnPage.emit(pageNumber);
  }
}
