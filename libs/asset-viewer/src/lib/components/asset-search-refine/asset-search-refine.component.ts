import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatOptionSelectionChange } from '@angular/material/core';
import { AssetSearchQuery, Contact, ContactId, LocalDate, LocalDateRange, ValueCount } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { map, startWith, Subscription } from 'rxjs';

import * as actions from '../../state/asset-search/asset-search.actions';
import { PanelState, resetSearch } from '../../state/asset-search/asset-search.actions';
import {
  Filter,
  selectActiveFilters,
  selectAssetKindFilters,
  selectAvailableAuthors,
  selectCreatedAt,
  selectGeometryFilters,
  selectIsFiltersOpen,
  selectLanguageFilters,
  selectAssetTopicFilters,
  selectSearchQuery,
  selectUsageCodeFilters,
  selectWorkgroupFilters,
  selectStatusFilters,
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

  public authorAutoCompleteControl = new FormControl('');
  public minDateControl = new FormControl<Date | undefined>(undefined);
  public maxDateControl = new FormControl<Date | undefined>(undefined);

  public createdAtRange: LocalDateRange | null = null;
  public availableAuthors: Array<ValueCount<Contact>> = [];
  public filteredAuthors: Array<ValueCount<Contact>> = [];
  public selectedAuthor?: ValueCount<Contact>;
  public minDate?: Date;
  public maxDate?: Date;
  public isFiltersOpen = false;

  public assetSearchQuery!: AssetSearchQuery;

  public activeFilters: Filter<string | number>[] = [];
  private readonly createDateRange$ = this.store.select(selectCreatedAt);
  private readonly availableAuthors$ = this.store.select(selectAvailableAuthors);
  private readonly isFiltersOpen$ = this.store.select(selectIsFiltersOpen);

  readonly usageCodeFilters$ = this.store.select(selectUsageCodeFilters);
  readonly geometryCodeFilters$ = this.store.select(selectGeometryFilters);
  readonly statusFilters$ = this.store.select(selectStatusFilters);
  readonly manCatLabelFilters$ = this.store.select(selectAssetTopicFilters);
  readonly languageFilters$ = this.store.select(selectLanguageFilters);
  readonly assetKindFilters$ = this.store.select(selectAssetKindFilters);
  readonly workgroupFilters$ = this.store.select(selectWorkgroupFilters);

  readonly activeFilters$ = this.store.select(selectActiveFilters);
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
      this.minDateControl.valueChanges.subscribe((minDate) => {
        if (minDate instanceof Date || minDate === undefined) {
          this.minDate = minDate;
          const maxDate = this.maxDateControl.getRawValue();
          this.updateSearch({
            createdAt: {
              min: minDate == null ? undefined : LocalDate.fromDate(minDate),
              max: maxDate == null ? undefined : LocalDate.fromDate(maxDate),
            },
          });
        }
      }),
    );
    this.subscriptions.add(
      this.maxDateControl.valueChanges.subscribe((maxDate) => {
        if (maxDate instanceof Date || maxDate === undefined) {
          this.maxDate = maxDate;
          const minDate = this.minDateControl.getRawValue();
          this.updateSearch({
            createdAt: {
              min: minDate == null ? undefined : LocalDate.fromDate(minDate),
              max: maxDate == null ? undefined : LocalDate.fromDate(maxDate),
            },
          });
        }
      }),
    );
  }

  public get minCreateDate(): Date | null {
    const min = this.createdAtRange?.min?.toDate();
    if (min == null) {
      return null;
    }
    return min.getTime() < MIN_CREATE_DATE.getTime() ? MIN_CREATE_DATE : min;
  }

  public removePolygon() {
    this.store.dispatch(actions.updateSearchQuery({ query: { polygon: undefined } }));
  }

  public toggleDrawPolygon() {
    this.store.dispatch(mapControlActions.toggleDraw());
  }

  public updateAuthor(event: MatOptionSelectionChange, authorId: ContactId) {
    if (event.isUserInput) {
      this.updateSearch({ authorId });
      this.selectedAuthor = this.filteredAuthors.find((a) => a.value.id === authorId);
    }
  }

  public updateSearch(filterConfiguration: Partial<AssetSearchQuery>) {
    if (this.isFiltersOpen) {
      this.store.dispatch(actions.updateSearchQuery({ query: filterConfiguration }));
    }
  }

  public filterAuthors(value: string): Array<ValueCount<Contact>> {
    const filterValue = value.toLowerCase();
    return this.availableAuthors.filter((author) => author.value.name.toLowerCase().includes(filterValue));
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
    this.authorAutoCompleteControl.setValue('');
    this.maxDateControl.setValue(null);
    this.maxDateControl.setValue(null);
    this.store.dispatch(resetSearch());
  }

  public removeFilter(filterToRemove: Filter<string | number>) {
    const remainingFiltersWithSameKey = this.activeFilters
      .filter((filter) => filter.queryKey === filterToRemove.queryKey && filter.value !== filterToRemove.value)
      .map((remainingFilter) => remainingFilter.value);
    this.store.dispatch(
      actions.updateSearchQuery({
        query: {
          [filterToRemove.queryKey]: remainingFiltersWithSameKey.length > 0 ? remainingFiltersWithSameKey : undefined,
        },
      }),
    );
  }

  public closeFilters() {
    this.store.dispatch(actions.setFiltersState({ state: PanelState.ClosedManually }));
  }

  private initSubscriptions() {
    this.subscriptions.add(this.isFiltersOpen$.subscribe((isOpen) => (this.isFiltersOpen = isOpen)));
    this.subscriptions.add(this.activeFilters$.subscribe((activeFilter) => (this.activeFilters = activeFilter)));
    this.subscriptions.add(
      this.store.select(selectSearchQuery).subscribe((query) => {
        this.assetSearchQuery = query;
      }),
    );

    this.subscriptions.add(
      this.createDateRange$.subscribe((dateRange) => {
        this.createdAtRange = dateRange;
      }),
    );

    this.subscriptions.add(
      this.availableAuthors$.subscribe((authors) => {
        this.availableAuthors = authors ?? [];
        this.filteredAuthors = authors ?? [];
      }),
    );

    this.subscriptions.add(
      this.authorAutoCompleteControl.valueChanges
        .pipe(
          startWith(''),
          map((value) => this.filterAuthors(value ?? '')),
        )
        .subscribe((filteredAuthors) => {
          this.filteredAuthors = filteredAuthors;
        }),
    );
  }

  protected trackFilter(filter: Filter<string | number>): string {
    return `${filter.queryKey}:${filter.value}`;
  }
}
