import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FilterChangedEvent, fromAppShared, PossibleValue } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { Role, User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatestWith, filter, map, Observable, Subscription, tap } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers, selectWorkgroups } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy, AfterViewInit {
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
  public readonly isAdminFilterValues: PossibleValue[] = [
    { displayValue: 'Admin', value: true },
    { displayValue: 'Nicht Admin', value: false },
  ];

  protected readonly COLUMNS = ['firstName', 'lastName', 'email', 'workgroups', 'isAdmin', 'languages', 'actions'];
  protected readonly WORKGROUP_DISPLAY_COUNT = 3;

  protected dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();
  @ViewChild(MatPaginator) protected paginator!: MatPaginator;

  private readonly searchTerm$ = new BehaviorSubject<string>('');
  private readonly activeFilters$ = new BehaviorSubject<Map<keyof User, (string | number | boolean)[]>>(new Map());

  private readonly store = inject(Store<AppStateWithAdmin>);
  public readonly users$ = this.store.select(selectUsers);
  private readonly workgroups$ = this.store.select(selectWorkgroups);
  private readonly subscriptions: Subscription = new Subscription();

  public readonly currentUser$: Observable<User> = this.store.select(fromAppShared.selectRDUserProfile).pipe(
    map((currentUser) => (RD.isSuccess(currentUser) ? currentUser.value : null)),
    filter(isNotNull)
  );

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public setSearchTerm(term: string) {
    this.searchTerm$.next(term);
  }

  public setFilters(filterValues: FilterChangedEvent) {
    const activeFilters = this.activeFilters$.value.set(
      filterValues.field,
      filterValues.selectedValues.map((it) => it.value)
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

  public sortChange(sort: Sort) {
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
        case 'lang':
          return this.compare(a.lang, b.lang, isAsc);
        default:
          return 0;
      }
    });
  }

  private compare(a: string, b: string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  public *getUserWorkgroups(user: User): Iterable<Workgroup & { role: Role }> {
    const iter = user.roles.entries();
    for (let i = 0; i < this.WORKGROUP_DISPLAY_COUNT; i++) {
      const { value, done } = iter.next();
      if (done) {
        break;
      }
      const [workgroupId, role] = value;
      const workgroup = this.workgroups.get(workgroupId);
      if (workgroup == null) {
        continue;
      }
      yield { ...workgroup, role };
    }
  }

  public updateIsAdminStatus(user: User, event: MatCheckboxChange) {
    this.store.dispatch(actions.updateUser({ user: { ...user, isAdmin: event.checked } }));
  }

  public formatWorkgroupsTooltip(roles: User['roles']): string {
    let tooltip = '';
    for (const [workgroupId] of roles) {
      const workgroup = this.workgroups.get(workgroupId);
      if (workgroup == null) {
        continue;
      }
      if (tooltip.length !== 0) {
        tooltip += ',\n';
      }
      tooltip += `${workgroup.name}`;
    }
    return tooltip;
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
        users.forEach((user) => {
          const userWorkgroups = [];
          for (const workgroup of this.getUserWorkgroups(user)) {
            userWorkgroups.push(workgroup);
          }
          console.log(user.roles);
          console.log(userWorkgroups);
        });
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
  }
}
