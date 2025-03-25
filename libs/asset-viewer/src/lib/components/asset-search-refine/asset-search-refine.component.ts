import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatOptionSelectionChange } from '@angular/material/core';
import { Router } from '@angular/router';
import { AssetSearchQuery, DateRange } from '@asset-sg/shared';
import { Store } from '@ngrx/store';
import { combineLatest, map, startWith, Subscription } from 'rxjs';

import * as actions from '../../state/asset-search/asset-search.actions';
import {
  AvailableAuthor,
  Filter,
  selectAssetKindFilters,
  selectAssetSearchQuery,
  selectAvailableAuthors,
  selectCreateDate,
  selectGeometryFilters,
  selectIsFiltersOpen,
  selectLanguageFilters,
  selectManCatLabelFilters,
  selectUsageCodeFilters,
  selectWorkgroupFilters,
} from '../../state/asset-search/asset-search.selector';
import * as mapControlActions from '../../state/map-control/map-control.actions';
import { selectMapControlIsDrawing } from '../../state/map-control/map-control.selector';

const MIN_CREATE_DATE = new Date(1800, 0, 1);

@Component({
  selector: 'asset-sg-asset-search-refine',
  templateUrl: './asset-search-refine.component.html',
  styleUrls: ['./asset-search-refine.component.scss'],
  standalone: false,
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
  public selectedAuthor?: AvailableAuthor;
  public isFiltersOpen = false;

  public assetSearchQuery!: AssetSearchQuery;

  public activeFilters: Filter<string | number>[] = [];
  private readonly createDateRange$ = this.store.select(selectCreateDate);
  private readonly availableAuthors$ = this.store.select(selectAvailableAuthors);
  private readonly isFiltersOpen$ = this.store.select(selectIsFiltersOpen);

  readonly usageCodeFilters$ = this.store.select(selectUsageCodeFilters);
  readonly geometryCodeFilters$ = this.store.select(selectGeometryFilters);
  readonly manCatLabelFilters$ = this.store.select(selectManCatLabelFilters);
  readonly languageFilters$ = this.store.select(selectLanguageFilters);
  readonly assetKindFilters$ = this.store.select(selectAssetKindFilters);
  readonly workgroupFilters$ = this.store.select(selectWorkgroupFilters);

  readonly activeFilters$ = combineLatest([
    this.usageCodeFilters$,
    this.geometryCodeFilters$,
    this.manCatLabelFilters$,
    this.languageFilters$,
    this.assetKindFilters$,
    this.workgroupFilters$,
  ]).pipe(map((a) => a.flat(1).filter((filter) => filter.isActive)));

  readonly isDrawActive$ = this.store.select(selectMapControlIsDrawing);

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

  public get minCreateDate(): Date | null {
    const min = this.createDateRange?.min;
    if (min == null) {
      return null;
    }
    return min.getTime() < MIN_CREATE_DATE.getTime() ? MIN_CREATE_DATE : min;
  }

  public removePolygon() {
    this.store.dispatch(actions.clearPolygon());
  }

  public toggleDrawPolygon() {
    this.store.dispatch(mapControlActions.toggleDraw());
  }

  public updateAuthor(event: MatOptionSelectionChange, authorId: number) {
    if (event.isUserInput) {
      this.updateSearch({ authorId });
      this.selectedAuthor = this.filteredAuthors.find((a) => a.contactId === authorId);
    }
  }

  public updateSearch(filterConfiguration: Partial<AssetSearchQuery>) {
    if (this.isFiltersOpen) {
      this.store.dispatch(actions.mergeQuery({ query: filterConfiguration }));
    }
  }

  public filterAuthors(value: string): AvailableAuthor[] {
    const filterValue = value.toLowerCase();
    return this.availableAuthors.filter((author) => author.name.toLowerCase().includes(filterValue));
  }

  public resetAuthorSearch() {
    this.selectedAuthor = undefined;
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

  public removeFilter(filterToRemove: Filter<string | number>) {
    const remainingFiltersWithSameKey = this.activeFilters
      .filter((filter) => filter.queryKey === filterToRemove.queryKey && filter.value !== filterToRemove.value)
      .map((remainingFilter) => remainingFilter.value);
    this.store.dispatch(
      actions.mergeQuery({
        query: {
          [filterToRemove.queryKey]: remainingFiltersWithSameKey.length > 0 ? remainingFiltersWithSameKey : undefined,
        },
      })
    );
  }

  public closeFilters() {
    this.store.dispatch(actions.setFiltersOpen({ isOpen: false }));
  }

  private initSubscriptions() {
    this.subscriptions.add(this.isFiltersOpen$.subscribe((isOpen) => (this.isFiltersOpen = isOpen)));
    this.subscriptions.add(this.activeFilters$.subscribe((activeFilter) => (this.activeFilters = activeFilter)));
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
