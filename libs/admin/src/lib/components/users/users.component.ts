import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ColumnDefinition, CURRENT_LANG, fromAppShared, PossibleValue } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, combineLatestWith, filter, map, Observable, Subscription, tap } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers, selectWorkgroups } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: false,
})
export class UsersComponent implements OnInit, OnDestroy {
  private users: User[] = [];

  public showFilters = false;
  public workgroups = new Map<WorkgroupId, Workgroup>();
  public workgroupFilterValues: PossibleValue[] = [];
  public readonly langFilterValues: PossibleValue[] = [
    { displayValue: 'DE', value: 'de' },
    { displayValue: 'EN', value: 'en' },
    { displayValue: 'FR', value: 'fr' },
    { displayValue: 'IT', value: 'en' },
  ];
  public isAdminFilterValues: PossibleValue[] = [];

  public COLUMNS: ColumnDefinition[] = [
    { key: 'firstName', header: 'admin.firstName', name: 'firstName', type: 'string', sortable: true },
    { key: 'lastName', header: 'admin.lastName', name: 'lastName', type: 'string', sortable: true },
    { key: 'email', header: 'admin.email', name: 'email', type: 'string', sortable: true },
    {
      key: 'roles',
      header: 'admin.workgroups',
      name: 'workgroups',
      type: 'workgroups',
      sortable: false,
      hasTooltip: true,
    },
    { key: 'isAdmin', header: 'admin.userPage.admin', name: 'isAdmin', type: 'checkbox', sortable: true },
    { key: 'lang', header: 'admin.userPage.lang', name: 'languages', type: 'string', sortable: true },
    { key: 'id', header: '', name: 'actions', type: 'action', sortable: false, icon: 'edit' },
  ];
  protected readonly WORKGROUP_DISPLAY_COUNT = 3;

  protected dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();

  private readonly searchTerm$ = new BehaviorSubject<string>('');
  private readonly activeFilters$ = new BehaviorSubject<Map<keyof User, (string | number | boolean)[]>>(new Map());

  private readonly store = inject(Store<AppStateWithAdmin>);
  public readonly users$ = this.store.select(selectUsers);
  private readonly workgroups$ = this.store.select(selectWorkgroups);
  public readonly currentLang$ = inject(CURRENT_LANG);
  private readonly translateService = inject(TranslateService);
  private readonly subscriptions: Subscription = new Subscription();

  public readonly currentUser$: Observable<User> = this.store.select(fromAppShared.selectRDUserProfile).pipe(
    map((currentUser) => (RD.isSuccess(currentUser) ? currentUser.value : null)),
    filter(isNotNull)
  );

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public setSearchTerm(term: string) {
    this.searchTerm$.next(term);
  }

  public toggleFilters() {
    this.showFilters = !this.showFilters;
    if (!this.showFilters) {
      this.activeFilters$.next(new Map());
    }
  }

  public setFilters(selectedValues: PossibleValue[], key: keyof User) {
    const activeFilters = this.activeFilters$.value.set(
      key,
      selectedValues.map((it) => it.value)
    );
    this.activeFilters$.next(activeFilters);
  }

  private filterUsersBySearchTerm(user: User, searchTerm: string) {
    return Object.entries(user).some(([key, value]) => {
      if (key === 'roles') {
        return Array.from((value as Map<number, string>).keys()).some((id) =>
          this.workgroups.get(id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  }

  private filterUsersByAttribute(user: User, filters: Map<keyof User, (string | number | boolean)[]>) {
    return Array.from(filters.entries()).every(([key, values]) => {
      if (values.length === 0) {
        return true;
      }
      const userValue = user[key];
      return values.some((value) => {
        if (key === 'roles') {
          return (userValue as Map<number, string>).has(value as number);
        }
        return value === userValue;
      });
    });
  }

  public updateIsAdminStatus(event: { id: string; event: MatCheckboxChange }) {
    const user = this.users.find((user) => user.id === event.id);
    if (user == null) {
      return;
    }
    this.store.dispatch(actions.updateUser({ user: { ...user, isAdmin: event.event.checked } }));
  }

  sortTable(sort: Sort) {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'firstName':
          return this.compare(a.firstName, b.firstName, isAsc);
        case 'lastName':
          return this.compare(a.lastName, b.lastName, isAsc);
        case 'email':
          return this.compare(a.email, b.email, isAsc);
        case 'languages':
          return this.compare(a.lang, b.lang, isAsc);
        case 'isAdmin':
          return this.compare(a.isAdmin.toString(), b.isAdmin.toString(), isAsc);
        default:
          return 0;
      }
    });
  }

  private compare(a: string, b: string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private initSubscriptions(): void {
    this.subscriptions.add(
      this.workgroups$.subscribe((workgroups) => {
        this.workgroups.clear();
        this.workgroupFilterValues = workgroups.map((workgroup) => ({
          value: workgroup.id,
          displayValue: workgroup.name,
        }));

        for (const workgroup of workgroups) {
          this.workgroups.set(workgroup.id, workgroup);
        }
      })
    );
    this.subscriptions.add(
      this.users$.subscribe((users) => {
        this.users = users;
        this.dataSource.data = users;
      })
    );
    this.subscriptions.add(
      this.searchTerm$
        .pipe(
          combineLatestWith(this.activeFilters$),
          tap(([term, filters]) => {
            this.dataSource.data = this.users.filter((user) => {
              return this.filterUsersBySearchTerm(user, term) && this.filterUsersByAttribute(user, filters);
            });
          })
        )
        .subscribe()
    );
    this.subscriptions.add(
      this.currentLang$.subscribe(() => {
        this.isAdminFilterValues = [
          { displayValue: this.translateService.instant('admin.userPage.admin'), value: true },
          { displayValue: this.translateService.instant('admin.userPage.noAdmin'), value: false },
        ];
      })
    );
  }
}
