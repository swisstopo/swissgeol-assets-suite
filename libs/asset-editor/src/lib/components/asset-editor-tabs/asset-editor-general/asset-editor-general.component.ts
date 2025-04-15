import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { fromAppShared, TranslatedValue, Translation } from '@asset-sg/client-shared';
import { ValueItem } from '@asset-sg/shared';
import { Role, SimpleWorkgroup } from '@asset-sg/shared/v2';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { combineLatestWith, map, Observable, startWith, Subscription } from 'rxjs';
// TODO: move selector to different module so it can be used in all modules
// eslint-disable-next-line @nx/enforce-module-boundaries
import { selectLanguageFilters } from '../../../../../../asset-viewer/src/lib/state/asset-search/asset-search.selector';
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

  public workgroups: SimpleWorkgroup[] = [];
  public languages: { name: Translation; value: string }[] = [];
  public selectedLanguages: string[] = [];
  public selectedManCatLabels: TranslatedValueItem[] = [];
  private readonly store = inject(Store);
  private readonly subscription: Subscription = new Subscription();
  public readonly manCatLabelItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectManCatLabelItems)
    .pipe(
      map((manCatLabelItems) => {
        if (manCatLabelItems == null) {
          return [];
        }
        return Object.values(manCatLabelItems).map(translatedValueItemFromValueItem);
      }),
    );
  public readonly assetFormatItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectAssetFormatItems)
    .pipe(
      map((assetFormatItems) => {
        if (assetFormatItems == null) {
          return [];
        }
        return Object.values(assetFormatItems).map(translatedValueItemFromValueItem);
      }),
    );
  public readonly assetKindItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectAssetKindItems)
    .pipe(
      map((assetKindItems) => {
        if (assetKindItems == null) {
          return [];
        }
        return Object.values(assetKindItems).map(translatedValueItemFromValueItem);
      }),
    );
  private readonly languageSelector$ = this.store.select(selectLanguageFilters).pipe(
    map((languageFilters) => {
      return languageFilters.map((lang) => ({ name: lang.name, value: lang.value }));
    }),
  );

  public readonly availableWorkgroups$ = this.store
    .select(fromAppShared.selectWorkgroups)
    .pipe(map((workgroups) => workgroups.filter((it) => it.role != Role.Viewer)));

  public ngOnInit() {
    this.subscription.add(this.availableWorkgroups$.subscribe((workgroups) => (this.workgroups = workgroups)));
    this.subscription.add(this.languageSelector$.subscribe((languages) => (this.languages = languages)));
    this.subscription.add(
      this.formGroup.controls.manCatLabelRefs.valueChanges
        .pipe(startWith(this.formGroup.controls.manCatLabelRefs.value), combineLatestWith(this.manCatLabelItems$))
        .subscribe(([selectedValues, manCatLabelItems]) => {
          this.selectedManCatLabels = manCatLabelItems.filter((item) => selectedValues?.includes(item.code));
        }),
    );
    this.selectedLanguages = this.formGroup.controls.assetLanguages.value?.map((lang) => lang.languageItemCode) ?? [];
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public setLangFromLangs(langs: string[]) {
    const languages = langs.map((l) => ({
      languageItemCode: l,
    }));
    this.formGroup.controls.assetLanguages.setValue(languages);
  }
}

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
