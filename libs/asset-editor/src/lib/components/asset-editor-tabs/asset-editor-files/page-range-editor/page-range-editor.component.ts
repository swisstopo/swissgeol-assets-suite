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
import { PdfViewerComponent, PdfViewerFile } from '@asset-sg/client-shared';
import {
  PageCategory,
  PageRangeClassification,
  SupportedPageLanguage,
  SupportedPageLanguages,
} from '@asset-sg/shared/v2';
import { TranslateDirective, TranslateService } from '@ngx-translate/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';
import { PageRangeEditorGroupComponent } from './page-range-editor-group/page-range-editor-group.component';

export type PageRangeEditorData = {
  classifications: PageRangeClassification[] | null;
  pageCount: number;
  assetId: number;
  assetFile: PdfViewerFile;
};

export type PageClassificationFormGroup = FormGroup<{
  from: FormControl<number>;
  to: FormControl<number>;
  languages: FormControl<SupportedPageLanguage[]>;
  categories: FormControl<PageCategory[]>;
  label: FormControl<string | null>;
}>;

type PageClassificationForm = FormGroup<{
  classifications: FormArray<PageClassificationFormGroup>;
}>;

export type SelectOption<T> = {
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
    SgcIcon,
    PdfViewerComponent,
    PageRangeEditorGroupComponent,
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
  protected expandedClassificationIndices = new Set<number>();
  private readonly initialClassificationsHash: string;

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
    this.expandedClassificationIndices = new Set();
    this.initialClassificationsHash = this.serializeClassifications(this.initialData.classifications ?? []);
  }

  protected hasUnsavedChanges(): boolean {
    const current = this.form.getRawValue().classifications;
    return this.serializeClassifications(current) !== this.initialClassificationsHash;
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
    this.expandedClassificationIndices.add(this.form.controls.classifications.length - 1);

    if (this.formWrapper) {
      setTimeout(() => {
        this.formWrapper.nativeElement.scrollTo({
          top: this.formWrapper.nativeElement.scrollHeight,
          behavior: 'smooth',
        });
      }, 0);
    }
  }

  protected updateOrder() {
    const controls = this.form.controls.classifications.controls;
    const indexed = controls.map((control, index) => ({
      control,
      index,
      value: control.getRawValue(),
    }));

    indexed.sort((a, b) => {
      if (a.value.from !== b.value.from) {
        return a.value.from - b.value.from;
      }
      if (a.value.to !== b.value.to) {
        return a.value.to - b.value.to;
      }

      const categoriesA = a.value.categories.join(',');
      const categoriesB = b.value.categories.join(',');
      if (categoriesA !== categoriesB) {
        return categoriesA.localeCompare(categoriesB);
      }

      const languagesA = a.value.languages.join(',');
      const languagesB = b.value.languages.join(',');
      if (languagesA !== languagesB) {
        return languagesA.localeCompare(languagesB);
      }

      const labelA = (a.value.label ?? '').trim();
      const labelB = (b.value.label ?? '').trim();
      if (labelA !== labelB) {
        return labelA.localeCompare(labelB);
      }

      // Stable sort fallback for identical values.
      return a.index - b.index;
    });

    const sortedControls = indexed.map((item) => item.control);
    const expanded = new Set<number>();
    indexed.forEach((item, newIndex) => {
      if (this.expandedClassificationIndices.has(item.index)) {
        expanded.add(newIndex);
      }
    });

    this.form.setControl('classifications', this.fb.array(sortedControls));
    this.expandedClassificationIndices = expanded;
  }

  protected removeClassification(index: number) {
    this.form.controls.classifications.removeAt(index);
    const updatedExpandedIndices = new Set<number>();
    this.expandedClassificationIndices.forEach((expandedIndex) => {
      if (expandedIndex === index) {
        return;
      }
      updatedExpandedIndices.add(expandedIndex > index ? expandedIndex - 1 : expandedIndex);
    });
    this.expandedClassificationIndices = updatedExpandedIndices;
  }

  protected toggleClassification(index: number) {
    if (this.expandedClassificationIndices.has(index)) {
      this.expandedClassificationIndices.delete(index);
      return;
    }
    this.expandedClassificationIndices.add(index);
  }

  protected isClassificationExpanded(index: number): boolean {
    return this.expandedClassificationIndices.has(index);
  }

  protected submit() {
    const classifications = this.form.getRawValue().classifications.map((classification) => ({
      ...classification,
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
        label: this.fb.control(pc.label ?? null),
      },
      { validators: this.toGreaterOrEqualFromValidator() },
    );
  }

  private serializeClassifications(classifications: PageRangeClassification[]): string {
    return JSON.stringify(
      classifications.map((classification) => ({
        from: classification.from,
        to: classification.to,
        categories: classification.categories,
        languages: classification.languages,
        label: classification.label?.trim() ? classification.label.trim() : null,
      })),
    );
  }
}
