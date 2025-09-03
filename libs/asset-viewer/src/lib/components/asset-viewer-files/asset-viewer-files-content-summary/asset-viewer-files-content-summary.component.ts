import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { LegalDocCode, PageCategory, SupportedPageLanguage } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-asset-viewer-files-content-summary',
  templateUrl: './asset-viewer-files-content-summary.component.html',
  styleUrls: ['./asset-viewer-files-content-summary.component.scss'],
  standalone: false,
})
export class AssetViewerFilesContentSummaryComponent implements AfterViewInit {
  @Input() public languages: SupportedPageLanguage[] = [];
  @Input() public categories: PageCategory[] = [];
  @Input({ required: true }) public pageCount!: number | null;
  @Input({ required: true }) public legalDocCode!: LegalDocCode | null;

  @ViewChild('tagGroup', { static: true }) tagGroup!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    this.truncateTagListsIfNeeded();

    const observer = new ResizeObserver(() => this.truncateTagListsIfNeeded());
    observer.observe(this.tagGroup.nativeElement);
  }

  private truncateTagListsIfNeeded() {
    const children = Array.from(this.tagGroup.nativeElement.children) as HTMLElement[];
    const lineMap = new Map<number, HTMLElement[]>();

    children.forEach((child) => {
      const top = Math.round(child.getBoundingClientRect().top);
      if (!lineMap.has(top)) {
        lineMap.set(top, []);
      }
      lineMap.get(top)!.push(child);
    });

    const sortedTops = Array.from(lineMap.keys()).sort((a, b) => a - b);
    const lineCount = sortedTops.length;

    if (lineCount >= 3) {
      const secondLineElements = lineMap.get(sortedTops[1])!;
      const lastElementOfSecondLine = secondLineElements[secondLineElements.length - 1];
      const removedTags: string[] = [lastElementOfSecondLine.firstChild!.textContent!];

      sortedTops.slice(2).forEach((top) => {
        lineMap.get(top)!.forEach((child) => {
          removedTags.push(child.firstChild!.textContent!);
          child.remove();
        });
      });

      lastElementOfSecondLine.firstChild!.textContent = `+${removedTags.length}`;
      lastElementOfSecondLine.setAttribute('title', removedTags.join('\n'));
    }
  }
}
