import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FilterChangedEvent, fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { Role, User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { filter, map, Observable, Subscription } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers, selectWorkgroups } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy, AfterViewInit {
  public workgroups = new Map<WorkgroupId, Workgroup>();
  public activeFilters = new Map<keyof User, (string | number | boolean)[]>();

  protected readonly COLUMNS = ['firstName', 'lastName', 'email', 'workgroups', 'isAdmin', 'languages', 'actions'];
  protected readonly WORKGROUP_DISPLAY_COUNT = 3;

  protected dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();
  @ViewChild(MatPaginator) protected paginator!: MatPaginator;

  private users: User[] = [];
  public names: string[] = [];
  public showFilters = true;

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

  public test(filterValues: FilterChangedEvent) {
    this.activeFilters.set(
      filterValues.field,
      filterValues.selectedValues.map((it) => it.value)
    );
    this.dataSource.data = this.users.filter((user) => {
      // Check all filter conditions against the user
      for (const [key, values] of this.activeFilters) {
        if (values.length === 0) {
          continue;
        }
        const userValue = user[key];
        switch (typeof userValue) {
          case 'string':
            console.log(values, userValue);
            if (!values.map((it) => (it as string).toLowerCase()).includes(userValue.toLowerCase())) {
              return false;
            }
            break;
          case 'boolean':
            return values.some((it) => it === userValue);
          case 'object':
            // if (Array.isArray(userValue)) {
            //   if (!values.map((it) => it.value.toLowerCase()).includes(userValue.join(',').toLowerCase())) {
            //     return false;
            //   }
            // }
            break;
        }
      }
      return true;
    });
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
  }
}
