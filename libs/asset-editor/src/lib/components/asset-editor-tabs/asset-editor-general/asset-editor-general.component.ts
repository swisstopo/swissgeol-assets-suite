import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { fromAppShared, TranslatedValue } from '@asset-sg/client-shared';
import { AssetEditDetail, ValueItem } from '@asset-sg/shared';
import { Role, SimpleWorkgroup } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatestWith, map, Observable, startWith, Subscription } from 'rxjs';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-editor-general',
  styleUrls: ['./asset-editor-general.component.scss'],
  templateUrl: './asset-editor-general.component.html',
  standalone: false,
})
export class AssetEditorGeneralComponent implements OnInit, OnDestroy {
  @Input() form!: AssetForm['controls']['general'];
  @Input() asset: AssetEditDetail | null = null;

  public workgroups: SimpleWorkgroup[] = [];
  public selectedLanguages: string[] = [];
  public selectedManCatLabels: TranslatedValueItem[] = [];
  public selectedNatRelItems: TranslatedValueItem[] = [];
  private readonly store = inject(Store);
  public readonly natRelItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectNatRelItems)
    .pipe(map(mapValueItemsToTranslatedItem));
  public readonly manCatLabelItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectManCatLabelItems)
    .pipe(map(mapValueItemsToTranslatedItem));
  public readonly assetFormatItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectAssetFormatItems)
    .pipe(map(mapValueItemsToTranslatedItem));
  public readonly assetKindItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectAssetKindItems)
    .pipe(map(mapValueItemsToTranslatedItem));
  public readonly languageItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectLanguageItems)
    .pipe(map(mapValueItemsToTranslatedItem));
  public readonly availableWorkgroups$ = this.store
    .select(fromAppShared.selectWorkgroups)
    .pipe(map((workgroups) => workgroups.filter((it) => it.role != Role.Reader)));
  private readonly subscription: Subscription = new Subscription();

  public ngOnInit() {
    this.subscription.add(this.availableWorkgroups$.subscribe((workgroups) => (this.workgroups = workgroups)));
    this.subscription.add(
      this.form.controls.manCatLabelRefs.valueChanges
        .pipe(startWith(this.form.controls.manCatLabelRefs.value), combineLatestWith(this.manCatLabelItems$))
        .subscribe(([selectedValues, manCatLabelItems]) => {
          this.selectedManCatLabels = manCatLabelItems.filter((item) => selectedValues?.includes(item.code));
        }),
    );
    this.subscription.add(
      this.form.controls.typeNatRels.valueChanges
        .pipe(startWith(this.form.controls.typeNatRels.value), combineLatestWith(this.natRelItems$))
        .subscribe(([selectedValues, natRelItems]) => {
          this.selectedNatRelItems = natRelItems.filter((item) => selectedValues?.includes(item.code));
        }),
    );
    this.subscription.add(
      this.form.controls.assetLanguages.valueChanges
        .pipe(startWith(this.form.controls.assetLanguages.value))
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
    this.form.controls.assetLanguages.setValue(languages);
    this.form.markAsDirty();
  }

  public removeItemFromForm(item: TranslatedValueItem, controlName: 'manCatLabelRefs' | 'typeNatRels') {
    const currentValues = this.form.controls[controlName].value ?? [];
    const newValues = currentValues.filter((value: string) => value !== item.code);
    this.form.controls[controlName].setValue(newValues);
    this.form.markAsDirty();
  }

  public addNewAlternativeId() {
    this.form.controls.ids.setValue([
      ...this.form.controls.ids.value,
      {
        idId: null,
        id: '',
        description: '',
      },
    ]);
    this.form.markAsDirty();
  }
}

export interface TranslatedValueItem {
  code: string;
  value: TranslatedValue;
}

export const mapValueItemsToTranslatedItem = (item: Record<string, ValueItem> | null): TranslatedValueItem[] => {
  if (item == null) {
    return [];
  }
  return Object.values(item).map(mapValueItemToTranslatedItem);
};

const mapValueItemToTranslatedItem = (item: ValueItem): TranslatedValueItem => {
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
