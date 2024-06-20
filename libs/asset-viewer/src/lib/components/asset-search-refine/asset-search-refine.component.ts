import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatOptionSelectionChange } from '@angular/material/core';
import { Router } from '@angular/router';
import { CURRENT_LANG, fromAppShared } from '@asset-sg/client-shared';
import { AssetSearchQuery, DateRange } from '@asset-sg/shared';
import { Store } from '@ngrx/store';
import { map, startWith, Subscription } from 'rxjs';

import * as actions from '../../state/asset-search/asset-search.actions';
import {
  AvailableAuthor,
  Filter,
  selectAssetKindFilters,
  selectAssetSearchQuery,
  selectAvailableAuthors,
  selectCreateDate,
  selectGeometryFilters,
  selectLanguageFilters,
  selectManCatLabelFilters,
  selectUsageCodeFilters,
} from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-refine',
  templateUrl: './asset-search-refine.component.html',
  styleUrls: ['./asset-search-refine.component.scss'],
})
export class AssetSearchRefineComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  public authorAutoCompleteControl = new FormControl('');
  public minDateControl = new FormControl();
  public maxDateControl = new FormControl();

  public createDateRange: DateRange | null = null;
  public availableAuthors: AvailableAuthor[] = [];
  public filteredAuthors: AvailableAuthor[] = [];
  public isPanelOpen = false;

  public assetSearchQuery!: AssetSearchQuery;

  private readonly createDateRange$ = this.store.select(selectCreateDate);
  private readonly availableAuthors$ = this.store.select(selectAvailableAuthors);

  readonly usageCodeFilters$ = this.store.select(selectUsageCodeFilters);
  readonly geometryCodeFilters$ = this.store.select(selectGeometryFilters);
  readonly manCatLabelFilters$ = this.store.select(selectManCatLabelFilters);
  readonly languageFilters$ = this.store.select(selectLanguageFilters);
  readonly assetKindFilters$ = this.store.select(selectAssetKindFilters);

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
      this.minDateControl.valueChanges.subscribe((value) => {
        if (value instanceof Date || value === undefined) {
          this.updateSearch({ createDate: { min: value, max: this.maxDateControl.getRawValue() } });
        }
      })
    );
    this.subscriptions.add(
      this.maxDateControl.valueChanges.subscribe((value) => {
        if (value instanceof Date || value === undefined) {
          this.updateSearch({ createDate: { min: this.minDateControl.getRawValue(), max: value } });
        }
      })
    );
  }

  public removePolygon() {
    this.store.dispatch(actions.removePolygon());
  }

  public toggleFilter<T extends string>(all: Array<Filter<T>>, filter: Filter<T>): void {
    const activeValues = new Set(all.filter((it) => it.isActive).map((it) => it.value));
    if (activeValues.has(filter.value)) {
      activeValues.delete(filter.value);
    } else {
      activeValues.add(filter.value);
    }
    this.updateSearch({ [filter.queryKey]: [...activeValues] });
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
    void this.router.navigate([]);
    this.authorAutoCompleteControl.setValue('');
    this.maxDateControl.setValue(null);
    this.maxDateControl.setValue(null);
    this.store.dispatch(actions.resetSearch());
  }

  private initSubscriptions() {
    this.subscriptions.add(this.isPanelOpen$.subscribe((isOpen) => (this.isPanelOpen = isOpen)));

    this.subscriptions.add(
      this.store.select(selectAssetSearchQuery).subscribe((query) => {
        this.assetSearchQuery = query;
      })
    );

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
      this.authorAutoCompleteControl.valueChanges
        .pipe(
          startWith(''),
          map((value) => this.filterAuthors(value ?? ''))
        )
        .subscribe((filteredAuthors) => {
          this.filteredAuthors = filteredAuthors;
        })
    );
  }
}
