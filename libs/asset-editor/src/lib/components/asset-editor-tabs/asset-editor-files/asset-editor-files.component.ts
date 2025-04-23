import { Component, Input } from '@angular/core';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-editor-files',
  styleUrls: ['./asset-editor-files.component.scss'],
  templateUrl: './asset-editor-files.component.html',
  standalone: false,
})
export class AssetEditorFilesComponent {
  @Input() form!: AssetForm['controls']['files'];
}
