import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AssetFileType } from '@asset-sg/shared';
import { AssetForm } from '../../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-file-drop-zone',
  styleUrls: ['./file-drop-zone.component.scss'],
  templateUrl: './file-drop-zone.component.html',
  standalone: false,
})
export class FileDropZoneComponent {
  @Input() public form!: AssetForm['controls']['files'];
  @Input() public fileType: AssetFileType = 'Normal';
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
      this.form.controls.assetFiles.push(
        new FormControl(
          {
            id: 0,
            name: element.name,
            size: element.size,
            legalDocItemCode: this.fileType === 'Legal' ? 'federalData' : null,
            type: this.fileType,
            selected: false,
            willBeDeleted: false,
            file: element,
            lastModifiedAt: new Date(),
          },
          { nonNullable: true },
        ),
      );
      this.form.markAsDirty();
    }
  }
}
