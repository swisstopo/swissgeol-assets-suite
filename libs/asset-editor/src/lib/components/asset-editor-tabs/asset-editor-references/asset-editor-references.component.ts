import { Component, Input } from '@angular/core';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-editor-references',
  styleUrls: ['./asset-editor-references.component.scss'],
  templateUrl: './asset-editor-references.component.html',
  standalone: false,
})
export class AssetEditorReferencesComponent {
  @Input() form!: AssetForm['controls']['references'];
}
