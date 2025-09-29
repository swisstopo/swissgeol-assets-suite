import { Component, Input } from '@angular/core';
import { LegalDocCode, PageCategory, PageRangeClassification, SupportedPageLanguage } from '@asset-sg/shared/v2';

type GroupedPageClassifications = { [key in PageCategory]?: PageRangeClassification[] };
type PageContent = {
  groupedPageClassifications: GroupedPageClassifications;
  languages: SupportedPageLanguage[];
  categories: PageCategory[];
};

@Component({
  selector: 'asset-sg-asset-viewer-files-content',
  templateUrl: './asset-viewer-files-content.component.html',
  styleUrls: ['./asset-viewer-files-content.component.scss'],
  standalone: false,
})
export class AssetViewerFilesContentComponent {
  @Input({ required: true }) public pageCount!: number | null;
  @Input({ required: true }) public legalDocCode!: LegalDocCode | null;
  protected groupedPageClassifications!: PageContent;

  @Input({ required: true })
  public set pageRangeClassifications(value: PageRangeClassification[]) {
    this.groupedPageClassifications = this.extractGroupedPageRageClassifications(value);
  }

  private extractGroupedPageRageClassifications(pageRangeClassifications: PageRangeClassification[]): PageContent {
    const languages = new Set<SupportedPageLanguage>();
    const categories = new Set<PageCategory>();
    const groupedPageClassifications: GroupedPageClassifications = {};
    pageRangeClassifications.forEach((pc) => {
      pc.categories.forEach((category) => {
        if (!groupedPageClassifications[category]) {
          groupedPageClassifications[category] = [];
        }
        groupedPageClassifications[category].push(pc);

        pc.languages.forEach((language) => {
          languages.add(language);
        });
        pc.categories.forEach((category) => {
          categories.add(category);
        });
      });
    });

    return {
      groupedPageClassifications,
      languages: Array.from(languages).sort((a, b) => a.localeCompare(b)),
      categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
    };
  }
}
