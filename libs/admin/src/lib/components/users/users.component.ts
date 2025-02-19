import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { CURRENT_LANG, Filter, fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { Lang } from '@asset-sg/shared';
import { Role, User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatestWith, filter, map, Observable, Subscription, tap } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers, selectWorkgroups } from '../../state/admin.selector';
import { AbstractAdminTableComponent } from '../abstract-admin-table/abstract-admin-table.component';

@Component({
  selector: 'asset-sg-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: false,
})
export class UsersComponent
  extends AbstractAdminTableComponent<User, User, string | number | boolean>
  implements OnInit, OnDestroy, AfterViewInit
{
  private users: User[] = [];

  public workgroups = new Map<WorkgroupId, Workgroup>();
  public workgroupFilterValues: Filter<number>[] = [];
  public readonly langFilterValues: Filter<Lang>[] = [
    { displayValue: 'DE', value: 'de' },
    { displayValue: 'EN', value: 'en' },
    { displayValue: 'FR', value: 'fr' },
    { displayValue: 'IT', value: 'en' },
  ];
  public isAdminFilterValues: Filter<boolean>[] = [];

  protected readonly COLUMNS = ['firstName', 'lastName', 'email', 'workgroups', 'isAdmin', 'languages'];
  protected readonly WORKGROUP_DISPLAY_COUNT = 3;

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
    this.store.dispatch(actions.listUsers());
    this.initSubscriptions();
  }

  public override ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  protected override matchBySearchTerm(user: User, searchTerm: string): boolean {
    searchTerm = searchTerm.toLowerCase();
    return Object.entries(user).some(([key, value]) => {
      if (key === 'roles') {
        return Array.from((value as Map<number, string>).keys()).some((id) =>
          this.workgroups.get(id)?.name.toLowerCase().includes(searchTerm)
        );
      }
      return value.toString().toLowerCase().includes(searchTerm);
    });
  }

  protected matchByFilters(user: User, filters: Map<keyof User, (string | number | boolean)[]>): boolean {
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

  public updateIsAdminStatus(user: User, event: MatCheckboxChange) {
    this.store.dispatch(actions.updateUser({ user: { ...user, isAdmin: event.checked } }));
  }

  public formatWorkgroupsTooltip(roles: User['roles']): string {
    let tooltip = '';
    for (const workgroupId of roles.keys()) {
      const workgroup = this.workgroups.get(workgroupId);
      if (workgroup == null) {
        continue;
      }
      if (tooltip.length !== 0) {
        tooltip += ', ';
      }
      tooltip += `${workgroup.name}`;
    }
    return tooltip;
  }

  public *getWorkgroupsOfUser(user: User): Iterable<Workgroup & { role: Role }> {
    let i = 0;
    for (const [workgroupId, role] of user.roles) {
      i += 1;
      if (i > this.WORKGROUP_DISPLAY_COUNT) {
        break;
      }
      const workgroup = this.workgroups.get(workgroupId);
      if (workgroup == null) {
        continue;
      }
      yield { ...workgroup, role };
    }
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
              return this.matchBySearchTerm(user, term) && this.matchByFilters(user, filters);
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
