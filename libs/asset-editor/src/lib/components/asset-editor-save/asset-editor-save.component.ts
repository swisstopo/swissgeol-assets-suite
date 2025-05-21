import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-save',
  templateUrl: './asset-editor-save.component.html',
  styleUrls: ['./asset-editor-save.component.scss'],
  standalone: false,
})
export class AssetEditorSaveComponent {
  @Input() public isSaveDisabled = false;
  @Input() public hasUnsavedChanges = false;
  @Output() public save = new EventEmitter<void>();
  @Output() public discard = new EventEmitter<void>();

  public saveChanges() {
    this.save.emit();
  }

  public discardChanges() {
    this.discard.emit();
  }
}
