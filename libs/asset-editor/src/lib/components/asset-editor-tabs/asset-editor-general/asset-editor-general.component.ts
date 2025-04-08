import { Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AssetForm } from '../../asset-editor-page';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-general',
  styleUrls: ['./asset-editor-general.component.scss'],
  templateUrl: './asset-editor-general.component.html',
  standalone: false,
})
export class AssetEditorGeneralComponent {
  @Input() formGroup!: AssetForm['controls']['general'];
}
