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
  styleUrls: ['./asset-editor-tab-files.component.scss'],
  standalone: false,
})
export class AssetEditorTabFilesComponent implements OnInit {
  @Input({ required: true })
  referenceDataVM$!: Observable<fromAppShared.ReferenceDataVM>;

  private readonly formGroupDirective = inject(FormGroupDirective);
  private readonly rootFormGroup: AssetEditorFormGroup = this.formGroupDirective.control;
  public form!: AssetEditorFilesFormGroup;

  public readonly isDisabled$ = isAssetEditorFormDisabled$(this.rootFormGroup);

  ngOnInit(): void {
    this.form = this.rootFormGroup.controls.files;
  }
}
