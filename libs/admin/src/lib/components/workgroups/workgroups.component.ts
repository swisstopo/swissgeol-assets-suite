import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Filter } from '@asset-sg/client-shared';
import { User, UserOnWorkgroupSchema, Workgroup } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Role } from '@prisma/client';
import { combineLatestWith, Subscription, tap } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers, selectWorkgroups } from '../../state/admin.selector';
import { AbstractAdminTableComponent } from '../abstract-admin-table/abstract-admin-table.component';

type UsersPerRole = Array<[Role, number]>;

@Component({
  selector: 'asset-sg-workgroups',
  templateUrl: './workgroups.component.html',
  styleUrls: ['./workgroups.component.scss'],
  standalone: false,
})
export class WorkgroupsComponent
  extends AbstractAdminTableComponent<Workgroup, Workgroup, boolean>
  implements OnInit, OnDestroy, AfterViewInit
{
  protected readonly COLUMNS = ['name', 'numberOfAssets', 'users', 'status', 'actions'];
  public workgroups: Array<Workgroup & { usersPerRole: UsersPerRole }> = [];
  public users: User[] = [];

  private readonly translateService = inject(TranslateService);
  private readonly store = inject(Store<AppStateWithAdmin>);
  public isActiveFilterValues = [
    { displayValue: this.translateService.instant('admin.workgroupPage.isActive'), value: true },
    { displayValue: this.translateService.instant('admin.workgroupPage.isDisabled'), value: false },
  ];
  private readonly users$ = this.store.select(selectUsers);
  readonly workgroups$ = this.store.select(selectWorkgroups);
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public override ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public override setFilters(selectedValues: Filter<boolean>[], key: keyof Workgroup) {
    const activeFilters = this.activeFilters$.value.set(
      key,
      selectedValues.map((it) => it.value)
    );
    this.activeFilters$.next(activeFilters);
  }

  protected matchByFilters(workgroup: Workgroup, filters: Map<keyof Workgroup, boolean[]>): boolean {
    return Array.from(filters.entries()).every(([key, values]) => {
      if (values.length === 0) {
        return true;
      }
      const workgroupValue = workgroup[key];
      return values.some((value) => {
        if (key === 'disabledAt') {
          return !!workgroupValue !== value;
        }
        return false;
      });
    });
  }

  protected override matchBySearchTerm(workgroup: Workgroup, searchTerm: string): boolean {
    searchTerm = searchTerm.toLowerCase();
    return Object.entries(workgroup).some(([key, value]) => {
      if (key === 'users') {
        return Array.from((value as Map<string, UserOnWorkgroupSchema>).keys()).some((id) => {
          const userRoles = this.users.find((user) => user.id === id)?.roles.values();
          if (!userRoles) {
            return false;
          }
          return Array.from(userRoles).some((role) => role.toLowerCase().includes(searchTerm));
        });
      }
      if (key === 'disabledAt') {
        return false;
      }
      return value.toString().toLowerCase().includes(searchTerm);
    });
  }

  getNumberOfUsersPerRoleForWorkgroup(workgroup: Workgroup): UsersPerRole {
    const usersPerRole: Map<Role, number> = new Map();
    for (const user of workgroup.users.values()) {
      if (usersPerRole.has(user.role)) {
        usersPerRole.set(user.role, usersPerRole.get(user.role)! + 1);
      } else {
        usersPerRole.set(user.role, 1);
      }
    }
    return Array.from(usersPerRole);
  }

  public deleteWorkgroup(event: MouseEvent, workgroupId: number) {
    event.stopPropagation();
    this.store.dispatch(actions.deleteWorkgroup({ workgroupId }));
  }

  private initSubscriptions() {
    this.subscriptions.add(
      this.searchTerm$
        .pipe(
          combineLatestWith(this.activeFilters$),
          tap(([searchTerm, activeFilters]) => {
            this.dataSource.data = this.workgroups.filter((workgroup) => {
              return this.matchBySearchTerm(workgroup, searchTerm) && this.matchByFilters(workgroup, activeFilters);
            });
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.workgroups$.subscribe((workgroups) => {
        this.workgroups = workgroups.map((workgroup) => {
          const usersPerRole = this.getNumberOfUsersPerRoleForWorkgroup(workgroup);
          return { ...workgroup, usersPerRole };
        });
        this.dataSource.data = this.workgroups;
      })
    );
    this.subscriptions.add(
      this.users$.subscribe((users) => {
        this.users = users;
      })
    );
  }
}
