import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CreateAssetFileData, LegalDocCode } from '@asset-sg/shared/v2';
import { AssetForm } from '../../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-file-drop-zone',
  styleUrls: ['./file-drop-zone.component.scss'],
  templateUrl: './file-drop-zone.component.html',
  standalone: false,
})
export class FileDropZoneComponent {
  @Input() public form!: AssetForm['controls']['files'];
  @Input({ transform: coerceBooleanProperty }) public isLegal = false;
  public isDragging = false;
  public isFileTooLarge = false;

  public onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  public onDragLeave() {
    this.isDragging = false;
  }

  public onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(input.files);
    }
  }

  private handleFiles(files: FileList) {
    for (const element of Array.from(files)) {
      if (element.size > 2000 * 1024 * 1024) {
        this.isFileTooLarge = true;
        return;
      }
      this.isFileTooLarge = false;
      this.form.controls.push(
        new FormControl<CreateAssetFileData & { shouldBeDeleted: boolean }>(
          {
            file: element,
            legalDocCode: this.isLegal ? LegalDocCode.FederalData : null,
            shouldBeDeleted: false,
          },
          { nonNullable: true },
        ),
      );
      this.form.markAsDirty();
      this.form.updateValueAndValidity();
    }
  }
}
