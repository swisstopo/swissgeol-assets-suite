import { Component, Input } from '@angular/core';
import { AssetEditDetail } from '@asset-sg/shared';

@Component({
  selector: 'asset-sg-editor-legacy-data',
  styleUrls: ['./asset-editor-legacy-data.component.scss'],
  templateUrl: './asset-editor-legacy-data.component.html',
  standalone: false,
})
export class AssetEditorLegacyDataComponent {
  @Input() asset: AssetEditDetail | null = null;
}
