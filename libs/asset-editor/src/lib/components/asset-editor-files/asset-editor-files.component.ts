import { Component, inject, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { fromAppShared } from '@asset-sg/client-shared';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { FileType } from '@prisma/client';
import { filter, map } from 'rxjs';
import { AssetEditorFile, AssetEditorFileTypeFormGroup, AssetEditorNewFile } from '../asset-editor-form-group';

@Component({
  selector: '[asset-sg-editor-files]',
  templateUrl: './asset-editor-files.component.html',
  styleUrls: ['./asset-editor-files.component.scss'],
  standalone: false,
})
export class AssetEditorFilesComponent {
  @Input({ required: true })
  form!: AssetEditorFileTypeFormGroup;

  @Input({ required: true })
  type!: FileType;

  @Input({ required: true })
  isDisabled!: boolean;

  isFileTooLarge = false;

  private readonly store = inject(Store);
  public readonly legalDocItems$ = this.store.select(fromAppShared.selectRDReferenceDataVM).pipe(
    filter(RD.isSuccess),
    map((a) => Object.values(a.value.legalDocItems))
  );

  get hasFiles(): boolean {
    return this.existingFiles.length !== 0 || this.newFiles.length !== 0;
  }

  get existingFiles(): AssetEditorFile[] {
    return this.form.controls.existingFiles.value;
  }

  get newFiles(): AssetEditorNewFile[] {
    return this.form.controls.newFiles.value;
  }

  handleFileInputChange(event: Event) {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    if (files && files.length > 0) {
      if (Array.from(files).some((f) => f.size > 2000 * 1024 * 1024)) {
        this.isFileTooLarge = true;
      } else {
        const file: AssetEditorNewFile = {
          type: this.type,
          legalDocItemCode: this.type === 'Normal' ? null : 'other',
          file: Array.from(files)[0],
        };
        this.form.controls.newFiles.push(new FormControl(file, { nonNullable: true }));
        this.form.markAsDirty();
        this.isFileTooLarge = false;
        element.value = '';
      }
    }
  }

  deleteFile(id: number): void {
    this.form.controls.filesToDelete.setValue([...this.form.controls.filesToDelete.value, id]);
    this.form.controls.existingFiles.setValue(
      this.form.controls.existingFiles.value.map((it) => (it.id !== id ? it : { ...it, willBeDeleted: true }))
    );
    this.form.markAsDirty();
  }

  removeNewFile(index: number) {
    this.form.controls.newFiles.removeAt(index);
  }
}
