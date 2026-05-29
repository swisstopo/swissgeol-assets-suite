import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PdfViewerComponent, PdfViewerFile, SelectComponent } from '@asset-sg/client-shared';
import {
  PageCategory,
  PageRangeClassification,
  SupportedPageLanguage,
  SupportedPageLanguages,
} from '@asset-sg/shared/v2';
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

export type PageRangeEditorData = {
  classifications: PageRangeClassification[] | null;
  pageCount: number;
  assetId: number;
  assetFile: PdfViewerFile;
};

type PageClassificationFormGroup = FormGroup<{
  from: FormControl<number>;
  to: FormControl<number>;
  languages: FormControl<SupportedPageLanguage[]>;
  categories: FormControl<PageCategory[]>;
  label: FormControl<string | null>;
}>;

type PageClassificationForm = FormGroup<{
  classifications: FormArray<PageClassificationFormGroup>;
}>;

type SelectOption<T> = {
  label: string;
  value: T;
};

@Component({
  selector: 'asset-sg-page-range-editor',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogActions,
    MatDialogContent,
    ReactiveFormsModule,
    TranslateDirective,
    SgcButton,
    SelectComponent,
    TranslatePipe,
    SgcIcon,
    PdfViewerComponent,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './page-range-editor.component.html',
  styleUrl: './page-range-editor.component.scss',
})
export class PageRangeEditorComponent {
  @ViewChild('formElement') protected formWrapper!: ElementRef;
  protected readonly availablePages: number[];
  protected readonly initialData: PageRangeEditorData = inject(MAT_DIALOG_DATA);
  protected form: PageClassificationForm;
  protected readonly categories: SelectOption<PageCategory>[];
  protected readonly languages: SelectOption<SupportedPageLanguage>[];

  private readonly dialogRef = inject(MatDialogRef<PageRangeEditorComponent, PageRangeClassification[]>);
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly translateService = inject(TranslateService);

  constructor() {
    this.availablePages = Array.from({ length: this.initialData.pageCount }, (_, i) => i + 1);
    this.categories = Object.values(PageCategory).map((cat) => ({
      label: this.translateService.instant('pageClassificationCodes.' + cat),
      value: cat,
    }));
    this.languages = SupportedPageLanguages.map((lang) => ({
      label: lang.toUpperCase(),
      value: lang,
    }));

    const initialValues: PageClassificationFormGroup[] = (this.initialData.classifications ?? []).map((pc) =>
      this.createFormGroup(pc),
    );
    this.form = this.fb.group({
      classifications: this.fb.array<PageClassificationFormGroup>(initialValues),
    });
  }

  protected addClassification() {
    const group: PageClassificationFormGroup = this.createFormGroup({
      categories: [],
      from: 1,
      to: 1,
      languages: [],
      label: null,
    });
    this.form.controls.classifications.push(group);

    if (this.formWrapper) {
      setTimeout(() => {
        this.formWrapper.nativeElement.scrollTo({
          top: this.formWrapper.nativeElement.scrollHeight,
          behavior: 'smooth',
        });
      }, 0);
    }
  }

  protected removeClassification(index: number) {
    this.form.controls.classifications.removeAt(index);
  }

  protected submit() {
    const classifications = this.form.getRawValue().classifications.map((classification) => ({
      ...classification,
      // Empty strings should fall back to translated category labels in the viewer.
      label: classification.label?.trim() ? classification.label.trim() : null,
    }));
    this.dialogRef.close(classifications);
  }

  protected cancel() {
    this.dialogRef.close();
  }

  private toGreaterOrEqualFromValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const to = group.get('to')?.value;
      const from = group.get('from')?.value;

      if (to != null && from != null && to < from) {
        return { toLessThanFrom: true };
      }
      return null;
    };
  }

  private createFormGroup(pc: PageRangeClassification): PageClassificationFormGroup {
    return this.fb.group(
      {
        to: this.fb.nonNullable.control(pc.to, [
          Validators.required,
          Validators.min(1),
          Validators.max(this.initialData.pageCount),
        ]),
        from: this.fb.nonNullable.control(pc.from, [
          Validators.required,
          Validators.min(1),
          Validators.max(this.initialData.pageCount),
        ]),
        languages: this.fb.nonNullable.control<SupportedPageLanguage[]>(pc.languages),
        categories: this.fb.nonNullable.control<PageCategory[]>(pc.categories, [
          Validators.required,
          Validators.minLength(1),
        ]),
        label: this.fb.control(pc.label ?? null, [Validators.maxLength(120)]),
      },
      { validators: this.toGreaterOrEqualFromValidator() },
    );
  }
}
