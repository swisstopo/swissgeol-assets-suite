import { Component, Input } from '@angular/core';

@Component({
  selector: 'asset-sg-asset-viewer-files-tag',
  templateUrl: './asset-viewer-files-tag.component.html',
  styleUrls: ['./asset-viewer-files-tag.component.scss'],
  standalone: false,
})
export class AssetViewerFilesTagComponent {
  @Input() public variant: 'normal' | 'small' = 'normal';
}
