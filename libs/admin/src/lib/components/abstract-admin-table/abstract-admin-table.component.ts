import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Filter } from '@asset-sg/client-shared';
import { BehaviorSubject, combineLatestWith, Subscription, tap } from 'rxjs';

@Component({
  template: '',
  standalone: false,
})
export abstract class AbstractAdminTableComponent<T extends object> implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild(MatPaginator) protected paginator!: MatPaginator;
  protected data: T[] = [];
  protected dataSource: MatTableDataSource<T> = new MatTableDataSource<T>();
  protected readonly searchTerm$ = new BehaviorSubject<string>('');
  protected readonly activeFilters$ = new BehaviorSubject<Array<Filter<T>>>([]);
  public shouldShowFilters = false;
  protected abstract readonly COLUMNS: string[];
  protected readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.subscriptions.add(
      this.searchTerm$
        .pipe(
          combineLatestWith(this.activeFilters$),
          tap(([searchTerm, activeFilters]) => {
            this.dataSource.data = this.data.filter((element) => {
              return this.matchBySearchTerm(element, searchTerm) && this.matchByFilters(element, activeFilters);
            });
          })
        )
        .subscribe()
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  public toggleFilters(showFilters: boolean) {
    this.shouldShowFilters = showFilters;
    if (!this.shouldShowFilters) {
      this.activeFilters$.next([]);
    }
  }

  public setSearchTerm(term: string) {
    this.searchTerm$.next(term);
  }

  public addFilter(filter: Filter<T>) {
    const activeFilters = this.activeFilters$.value;
    if (!activeFilters.includes(filter)) {
      activeFilters.push(filter);
    }
    this.activeFilters$.next(activeFilters);
  }

  public removeFilter(filter: Filter<T>) {
    const newFilters = this.activeFilters$.value.filter((activeFilter) => activeFilter !== filter);
    this.activeFilters$.next(newFilters);
  }

  protected matchBySearchTerm(userWorkgroup: T, searchTerm: string): boolean {
    searchTerm = searchTerm.toLowerCase();
    return Object.values(userWorkgroup).some((value) => {
      return value.toString().toLowerCase().includes(searchTerm);
    });
  }

  protected matchByFilters(mapValue: T, filters: Array<Filter<T>>): boolean {
    const allKeys = new Set<keyof T>();
    const matchedKeys = new Set<keyof T>();

    for (const filter of filters) {
      allKeys.add(filter.key);
      if (filter.match(mapValue)) {
        matchedKeys.add(filter.key);
      }
    }
    return allKeys.size === matchedKeys.size;
  }

  protected sortChange(sort: Sort): void {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const field = sort.active as keyof T;
      if (sort.active in a && sort.active in b) {
        if (
          (typeof a[field] === 'string' && typeof b[field] === 'string') ||
          (typeof a[field] === 'number' && typeof b[field] === 'number')
        ) {
          return compare(a[field], b[field], isAsc);
        }
      }
      return 0;
    });
  }
}

export function compare<T extends number | string>(a: T, b: T, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
