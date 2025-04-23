import { Component, Input } from '@angular/core';
import { AssetEditDetail } from '@asset-sg/shared';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-editor-contacts',
  styleUrls: ['./asset-editor-contacts.component.scss'],
  templateUrl: './asset-editor-contacts.component.html',
  standalone: false,
})
export class AssetEditorContactsComponent {
  @Input() form!: AssetForm['controls']['contacts'];
  @Input() asset: AssetEditDetail | null = null;
}
