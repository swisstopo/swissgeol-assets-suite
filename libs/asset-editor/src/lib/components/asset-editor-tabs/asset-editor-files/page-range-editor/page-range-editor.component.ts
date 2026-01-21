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
import { AlertType, PdfViewerComponent, PdfViewerFile, SelectComponent, showAlert } from '@asset-sg/client-shared';
import {
  PageCategory,
  PageClassification,
  PageRangeClassification,
  SupportedPageLanguage,
  SupportedPageLanguages,
  transformPagesToRanges,
} from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
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
  private readonly store = inject(Store);

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

  public handleManualRecalculation() {
    this.recalculateClassification();

    this.store.dispatch(
      showAlert({
        alert: {
          id: `recalculation-${Date.now()}`,
          text: this.translateService.instant('edit.tabs.files.pageRanges.recalculateSuccess'),
          type: AlertType.Success,
        },
      }),
    );
  }

  private recalculateClassification() {
    const pageRangeClassifications: PageRangeClassification[] = this.form.getRawValue().classifications;

    const pageClassifications: PageClassification[] = [];
    pageRangeClassifications.forEach(({ to, from, categories, languages }) => {
      Array.from({ length: to - from + 1 }, (_, i) => from + i).forEach((page) =>
        pageClassifications.push({
          page,
          categories: categories,
          languages: languages,
        }),
      );
    });

    const newFormArray = this.fb.array<PageClassificationFormGroup>(
      transformPagesToRanges(pageClassifications).map((pc) => this.createFormGroup(pc)),
    );

    this.form.setControl('classifications', newFormArray);
  }

  protected addClassification() {
    const group: PageClassificationFormGroup = this.createFormGroup({ categories: [], from: 1, to: 1, languages: [] });
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
    this.recalculateClassification();
    this.dialogRef.close(this.form.getRawValue().classifications);
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
      },
      { validators: this.toGreaterOrEqualFromValidator() },
    );
  }
}
