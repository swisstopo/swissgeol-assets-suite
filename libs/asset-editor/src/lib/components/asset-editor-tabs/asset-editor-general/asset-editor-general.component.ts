import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { fromAppShared, TranslatedValue } from '@asset-sg/client-shared';
import { ValueItem } from '@asset-sg/shared';
import { Role, SimpleWorkgroup } from '@asset-sg/shared/v2';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { combineLatestWith, map, Observable, startWith, Subscription } from 'rxjs';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';

interface TranslatedValueItem {
  code: string;
  value: TranslatedValue;
}

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-general',
  styleUrls: ['./asset-editor-general.component.scss'],
  templateUrl: './asset-editor-general.component.html',
  standalone: false,
})
export class AssetEditorGeneralComponent implements OnInit, OnDestroy {
  @Input() formGroup!: AssetForm['controls']['general'];
  @Input() sgsId: number | null = null;

  public workgroups: SimpleWorkgroup[] = [];
  public selectedLanguages: string[] = [];
  public selectedManCatLabels: TranslatedValueItem[] = [];
  public selectedNatRelItems: TranslatedValueItem[] = [];
  private readonly store = inject(Store);
  private readonly subscription: Subscription = new Subscription();
  public readonly natRelItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectNatRelItems)
    .pipe(map(translatedValueItemFromValueItemRecord));
  public readonly manCatLabelItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectManCatLabelItems)
    .pipe(map(translatedValueItemFromValueItemRecord));
  public readonly assetFormatItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectAssetFormatItems)
    .pipe(map(translatedValueItemFromValueItemRecord));
  public readonly assetKindItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectAssetKindItems)
    .pipe(map(translatedValueItemFromValueItemRecord));
  public readonly languageItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectLanguageItems)
    .pipe(map(translatedValueItemFromValueItemRecord));
  public readonly availableWorkgroups$ = this.store
    .select(fromAppShared.selectWorkgroups)
    .pipe(map((workgroups) => workgroups.filter((it) => it.role != Role.Viewer)));

  public ngOnInit() {
    this.subscription.add(this.availableWorkgroups$.subscribe((workgroups) => (this.workgroups = workgroups)));
    this.subscription.add(
      this.formGroup.controls.manCatLabelRefs.valueChanges
        .pipe(startWith(this.formGroup.controls.manCatLabelRefs.value), combineLatestWith(this.manCatLabelItems$))
        .subscribe(([selectedValues, manCatLabelItems]) => {
          this.selectedManCatLabels = manCatLabelItems.filter((item) => selectedValues?.includes(item.code));
        }),
    );
    this.subscription.add(
      this.formGroup.controls.typeNatRels.valueChanges
        .pipe(startWith(this.formGroup.controls.typeNatRels.value), combineLatestWith(this.natRelItems$))
        .subscribe(([selectedValues, natRelItems]) => {
          this.selectedNatRelItems = natRelItems.filter((item) => selectedValues?.includes(item.code));
        }),
    );
    this.subscription.add(
      this.formGroup.controls.assetLanguages.valueChanges
        .pipe(startWith(this.formGroup.controls.assetLanguages.value))
        .subscribe((langs) => {
          this.selectedLanguages = langs?.map((lang) => lang.languageItemCode) ?? [];
        }),
    );
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public setLangFromLangs(langs: string[]) {
    const languages = langs.map((l) => ({
      languageItemCode: l,
    }));
    this.formGroup.controls.assetLanguages.setValue(languages);
    this.formGroup.markAsDirty();
  }

  public removeItemFromForm(item: TranslatedValueItem, controlName: 'manCatLabelRefs' | 'typeNatRels') {
    const currentValues = this.formGroup.controls[controlName].value ?? [];
    const newValues = currentValues.filter((value: string) => value !== item.code);
    this.formGroup.controls[controlName].setValue(newValues);
    this.formGroup.markAsDirty();
  }

  public addNewAlternativeId() {
    this.formGroup.controls.ids.setValue([
      ...this.formGroup.controls.ids.value,
      {
        idId: null,
        id: '',
        description: '',
      },
    ]);
    this.formGroup.markAsDirty();
  }
}

const translatedValueItemFromValueItemRecord = (item: Record<string, ValueItem> | null): TranslatedValueItem[] => {
  if (item == null) {
    return [];
  }
  return Object.values(item).map(translatedValueItemFromValueItem);
};

const translatedValueItemFromValueItem = (item: ValueItem): TranslatedValueItem => {
  return {
    code: item.code,
    value: {
      de: item.nameDe,
      en: item.nameEn,
      fr: item.nameFr,
      it: item.nameIt,
    },
  };
};
