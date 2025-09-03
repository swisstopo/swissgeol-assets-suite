import { Component, Input } from '@angular/core';
import { LegalDocCode, PageClassification } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-asset-viewer-files-content',
  templateUrl: './asset-viewer-files-content.component.html',
  styleUrls: ['./asset-viewer-files-content.component.scss'],
  standalone: false,
})
export class AssetViewerFilesContentComponent {
  @Input({ required: true }) public pageClassifications!: PageClassification[];
  @Input({ required: true }) public pageCount!: number | null;
  @Input({ required: true }) public legalDocCode!: LegalDocCode | null;
}
