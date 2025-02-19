import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Filter } from '@asset-sg/client-shared';
import { SimpleWorkgroup } from '@asset-sg/shared/v2';
import { Role } from '@prisma/client';
import { BehaviorSubject } from 'rxjs';

export type WorkgroupOfUser = SimpleWorkgroup & { role: Role; isActive: boolean; numberOfAssets: number };

@Component({
  template: '',
  standalone: false,
})
export abstract class AbstractAdminTableComponent<DataSource extends object, MapKey, MapValue>
  implements AfterViewInit
{
  @ViewChild(MatPaginator) protected paginator!: MatPaginator;
  protected dataSource: MatTableDataSource<DataSource> = new MatTableDataSource<DataSource>();
  protected readonly searchTerm$ = new BehaviorSubject<string>('');
  protected readonly activeFilters$ = new BehaviorSubject<Map<keyof MapKey, Array<MapValue>>>(new Map());
  public shouldShowFilters = false;
  protected abstract readonly COLUMNS: string[];

  public ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  public toggleFilters(showFilters: boolean) {
    this.shouldShowFilters = showFilters;
    if (!this.shouldShowFilters) {
      this.activeFilters$.next(new Map());
    }
  }

  public setSearchTerm(term: string) {
    this.searchTerm$.next(term);
  }

  public setFilters(selectedValues: Filter<MapValue>[], key: keyof MapKey) {
    const activeFilters = this.activeFilters$.value.set(
      key,
      selectedValues.map((it) => it.value)
    );
    this.activeFilters$.next(activeFilters);
  }

  protected matchBySearchTerm(userWorkgroup: DataSource, searchTerm: string): boolean {
    const searchTermLowerCase = searchTerm.toLowerCase();
    return Object.values(userWorkgroup).some((value) => {
      return value.toString().toLowerCase().includes(searchTermLowerCase);
    });
  }

  protected abstract matchByFilters(mapValue: DataSource, filters: Map<keyof MapKey, MapValue[]>): boolean;

  protected sortChange(sort: Sort): void {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const field = sort.active as keyof DataSource;
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
