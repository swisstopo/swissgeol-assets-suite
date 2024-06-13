import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatOptionSelectionChange } from '@angular/material/core';
import { Router } from '@angular/router';
import { CURRENT_LANG, LifecycleHooksDirective, fromAppShared } from '@asset-sg/client-shared';
import { AssetSearchQuery, DateRange, GeometryCode, Lang, UsageCode, getValueItemNameKey } from '@asset-sg/shared';
import { concatLatestFrom } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Subscription, map, startWith } from 'rxjs';

import * as actions from '../../state/asset-search/asset-search.actions';
import {
  AvailableAuthor,
  AvailableItem,
  AvailableValueCount,
  selectAssetSearchQuery,
  selectAvailableAssetKindItems,
  selectAvailableAuthors,
  selectAvailableGeometries,
  selectAvailableLanguages,
  selectAvailableManCatLabels,
  selectCreateDate,
  selectUsageCodeData,
} from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-refine',
  templateUrl: './asset-search-refine.component.html',
  styleUrls: ['./asset-search-refine.component.scss'],
  hostDirectives: [LifecycleHooksDirective],
})
export class AssetSearchRefineComponent implements OnInit, OnDestroy, AfterViewInit {
  private _currentLang$ = inject(CURRENT_LANG);
  private store = inject(Store);
  private router = inject(Router);

  public authorAutoCompleteControl = new FormControl('');
  public minDateControl = new FormControl();
  public maxDateControl = new FormControl();

  public createDateRange: DateRange | null = null;
  public availableAuthors: AvailableAuthor[] = [];
  public filteredAuthors: AvailableAuthor[] = [];
  public availableGeomteryCodes: AvailableValueCount<GeometryCode | 'None'>[] = [];
  public usageCodes: AvailableValueCount<UsageCode>[] = [];
  public availableManCatLabels: AvailableItem[] = [];
  public availableLanguages: AvailableItem[] = [];
  public availableAssetKindItems: AvailableItem[] = [];
  public isPanelOpen = false;

  public readonly assetSearchQuery$ = this.store.select(selectAssetSearchQuery);
  private readonly createDateRange$ = this.store.select(selectCreateDate);
  private readonly availableAuthors$ = this.store.select(selectAvailableAuthors);
  private readonly usageCodes$ = this.store.select(selectUsageCodeData);
  private readonly availableGeometryCodes$ = this.store.select(selectAvailableGeometries);
  private readonly availableManCatLabels$ = this.store.select(selectAvailableManCatLabels);
  private readonly availableLanguages$ = this.store.select(selectAvailableLanguages);
  private readonly availableAssetKindItems$ = this.store.select(selectAvailableAssetKindItems);
  private readonly isPanelOpen$ = this.store.select(fromAppShared.selectIsPanelOpen);
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public ngAfterViewInit() {
    this.subscriptions.add(
      this.minDateControl.valueChanges.pipe().subscribe((value) => {
        if (value instanceof Date || value === undefined) {
          this.updateSearch({ createDate: { min: value, max: this.maxDateControl.getRawValue() } });
        }
      })
    );
    this.subscriptions.add(
      this.maxDateControl.valueChanges.pipe().subscribe((value) => {
        if (value instanceof Date || value === undefined) {
          this.updateSearch({ createDate: { min: this.minDateControl.getRawValue(), max: value } });
        }
      })
    );
  }

  public removePolygon() {
    this.store.dispatch(actions.removePolygon());
  }

  public updateManCatLabel(item: AvailableItem) {
    const availableItem: AvailableItem | undefined = this.availableManCatLabels.find(
      (element) => element.item.code === item.item.code
    );
    if (availableItem !== undefined) {
      availableItem.isActive = !item.isActive;
    }
    this.updateSearch({
      manCatLabelItemCodes: this.availableManCatLabels
        .filter((element) => element.isActive)
        .map((element) => element.item.code),
    });
  }

  public updateAssetKindItems(item: AvailableItem) {
    const availableItem: AvailableItem | undefined = this.availableAssetKindItems.find(
      (element) => element.item.code === item.item.code
    );
    if (availableItem !== undefined) {
      availableItem.isActive = !item.isActive;
    }
    this.updateSearch({
      assetKindItemCodes: this.availableAssetKindItems
        .filter((element) => element.isActive)
        .map((element) => element.item.code),
    });
  }

  public updateLanguages(item: AvailableItem) {
    const availableItem: AvailableItem | undefined = this.availableLanguages.find(
      (element) => element.item.code === item.item.code
    );
    if (availableItem !== undefined) {
      availableItem.isActive = !item.isActive;
    }
    this.updateSearch({
      languageItemCodes: this.availableLanguages
        .filter((element) => element.isActive)
        .map((element) => element.item.code),
    });
  }

  public updateUsageCodes(item: AvailableValueCount<UsageCode>) {
    const availableItem: AvailableValueCount<UsageCode> | undefined = this.usageCodes.find(
      (element) => element.value === item.value
    );
    if (availableItem !== undefined) {
      availableItem.isActive = !item.isActive;
    }
    this.updateSearch({
      usageCodes: this.usageCodes.filter((element) => element.isActive).map((element) => element.value),
    });
  }

  public updateGeometryCodes(item: AvailableValueCount<GeometryCode | 'None'>) {
    const availableItem: AvailableValueCount<GeometryCode | 'None'> | undefined = this.availableGeomteryCodes.find(
      (element) => element.value === item.value
    );
    if (availableItem !== undefined) {
      availableItem.isActive = !item.isActive;
    }
    this.updateSearch({
      geomCodes: this.availableGeomteryCodes.filter((element) => element.isActive).map((element) => element.value),
    });
  }

  public updateAuthor(event: MatOptionSelectionChange, authorId: number) {
    if (event.isUserInput) {
      this.updateSearch({ authorId });
    }
  }

  public updateSearch(filterConfiguration: Partial<AssetSearchQuery>) {
    if (this.isPanelOpen) {
      this.store.dispatch(actions.searchByFilterConfiguration({ filterConfiguration }));
    }
  }

  public filterAuthors(value: string): AvailableAuthor[] {
    const filterValue = value.toLowerCase();
    return this.availableAuthors.filter((author) => author.name.toLowerCase().includes(filterValue));
  }

  public resetAuthorSearch() {
    this.authorAutoCompleteControl.setValue('');
    this.updateSearch({ authorId: undefined });
  }

  public resetMinDateRangeSearch() {
    this.minDateControl.setValue(undefined);
  }

  public resetMaxDateRangeSearch() {
    this.maxDateControl.setValue(undefined);
  }

  public resetSearch() {
    this.router.navigate([]);
    this.authorAutoCompleteControl.setValue('');
    this.maxDateControl.setValue(null);
    this.maxDateControl.setValue(null);
    this.store.dispatch(actions.resetSearch());
  }

  private initSubscriptions() {
    this.subscriptions.add(this.isPanelOpen$.subscribe((isOpen) => (this.isPanelOpen = isOpen)));

    this.subscriptions.add(
      this.createDateRange$.subscribe((dateRange) => {
        this.createDateRange = dateRange;
      })
    );

    this.subscriptions.add(
      this.availableAuthors$.subscribe((authors) => {
        this.availableAuthors = authors ?? [];
        this.filteredAuthors = authors ?? [];
      })
    );

    this.subscriptions.add(
      this.usageCodes$.subscribe((usageCodes) => {
        this.usageCodes = usageCodes ?? [];
      })
    );

    this.subscriptions.add(
      this.availableGeometryCodes$.subscribe((geomCode) => {
        this.availableGeomteryCodes = geomCode ?? [];
      })
    );

    this.subscriptions.add(
      this.availableManCatLabels$
        .pipe(
          concatLatestFrom(() => this._currentLang$),
          map(([manCatLabels, lang]) => {
            this.availableManCatLabels = this.setLanguageForFilter(lang, manCatLabels ?? []);
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.availableLanguages$
        .pipe(
          concatLatestFrom(() => this._currentLang$),
          map(([languages, currentLang]) => {
            this.availableLanguages = this.setLanguageForFilter(currentLang, languages ?? []);
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.availableAssetKindItems$
        .pipe(
          concatLatestFrom(() => this._currentLang$),
          map(([assetKindItems, currentLang]) => {
            this.availableAssetKindItems = this.setLanguageForFilter(currentLang, assetKindItems ?? []);
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.authorAutoCompleteControl.valueChanges
        .pipe(
          startWith(''),
          map((value) => this.filterAuthors(value ?? ''))
        )
        .subscribe((filteredAuthors) => {
          this.filteredAuthors = filteredAuthors;
        })
    );

    this.subscriptions.add(
      this._currentLang$.subscribe((lang) => {
        this.availableAssetKindItems = this.setLanguageForFilter(lang, this.availableAssetKindItems);
        this.availableLanguages = this.setLanguageForFilter(lang, this.availableLanguages);
        this.availableManCatLabels = this.setLanguageForFilter(lang, this.availableManCatLabels);
      })
    );
  }

  private setLanguageForFilter(lang: Lang, availableFilters: AvailableItem[]): AvailableItem[] {
    const key = getValueItemNameKey(lang);
    const filtersWithDisplayName = availableFilters.map((filter) => {
      return {
        ...filter,
        displayName: filter.item[key],
      };
    });
    return filtersWithDisplayName.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
}
