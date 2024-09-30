import { Component, inject, Input, OnInit } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { fromAppShared } from '@asset-sg/client-shared';
import { Observable } from 'rxjs';
import {
  AssetEditorFilesFormGroup,
  AssetEditorFormGroup,
  isAssetEditorFormDisabled$,
} from '../asset-editor-form-group';

@Component({
  selector: 'asset-sg-editor-tab-files',
  templateUrl: './asset-editor-tab-files.component.html',
  styleUrl: './asset-editor-tab-files.component.scss',
})
export class AssetEditorTabFilesComponent implements OnInit {
  @Input({ required: true })
  referenceDataVM$!: Observable<fromAppShared.ReferenceDataVM>;

  private readonly formGroupDirective = inject(FormGroupDirective);
  private readonly rootFormGroup = this.formGroupDirective.control as AssetEditorFormGroup;
  public form!: AssetEditorFilesFormGroup;

  public readonly isDisabled$ = isAssetEditorFormDisabled$(this.rootFormGroup);

  ngOnInit(): void {
    // TODO check if inject in class body
    this.form = this.rootFormGroup.controls.files;
  }
}
