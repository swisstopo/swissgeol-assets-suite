import { Component, Input } from '@angular/core';
import { Asset } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-legacy-data',
  styleUrls: ['./asset-editor-legacy-data.component.scss'],
  templateUrl: './asset-editor-legacy-data.component.html',
  standalone: false,
})
export class AssetEditorLegacyDataComponent {
  @Input() asset: Asset | null = null;
}
