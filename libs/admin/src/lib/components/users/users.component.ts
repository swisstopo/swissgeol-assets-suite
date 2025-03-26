import { Component, inject, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { CURRENT_LANG, Filter, fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { Role, User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { filter, map, Observable } from 'rxjs';
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
export class UsersComponent extends AbstractAdminTableComponent<User> implements OnInit {
  public workgroups = new Map<WorkgroupId, Workgroup>();
  public workgroupFilters: Filter<User>[] = [];
  public readonly langFilters: Filter<User>[] = [
    { displayValue: 'DE', key: 'lang', match: (value) => value.lang === 'de' },
    { displayValue: 'EN', key: 'lang', match: (value) => value.lang === 'en' },
    { displayValue: 'FR', key: 'lang', match: (value) => value.lang === 'fr' },
    { displayValue: 'IT', key: 'lang', match: (value) => value.lang === 'it' },
  ];
  public filterForIsAdmin: Filter<User>[] = [];

  protected readonly COLUMNS = ['firstName', 'lastName', 'email', 'workgroups', 'isAdmin', 'languages'];
  private readonly searchableFields: Array<keyof User> = ['firstName', 'lastName', 'email'];
  protected readonly WORKGROUP_DISPLAY_COUNT = 3;

  private readonly store = inject(Store<AppStateWithAdmin>);
  public readonly users$ = this.store.select(selectUsers);
  private readonly workgroups$ = this.store.select(selectWorkgroups);
  public readonly currentLang$ = inject(CURRENT_LANG);

  public readonly currentUser$: Observable<User> = this.store.select(fromAppShared.selectRDUserProfile).pipe(
    map((currentUser) => (RD.isSuccess(currentUser) ? currentUser.value : null)),
    filter(isNotNull)
  );

  public override ngOnInit(): void {
    super.ngOnInit();
    this.store.dispatch(actions.listUsers());
    this.initSubscriptions();
  }

  protected override matchBySearchTerm(user: User, searchTerm: string): boolean {
    return this.searchableFields.some((field) =>
      user[field].toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
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
        this.workgroupFilters = workgroups.map((workgroup) => ({
          key: 'roles',
          displayValue: workgroup.name,
          match: (value) => value.roles.has(workgroup.id),
        }));

        for (const workgroup of workgroups) {
          this.workgroups.set(workgroup.id, workgroup);
        }
      })
    );
    this.subscriptions.add(
      this.users$.subscribe((users) => {
        this.data = users;
        this.dataSource.data = users;
      })
    );
    this.subscriptions.add(
      this.currentLang$.subscribe(() => {
        this.filterForIsAdmin = [
          { displayValue: { key: 'admin.userPage.admin' }, key: 'isAdmin', match: (value) => value.isAdmin },
          { displayValue: { key: 'admin.userPage.noAdmin' }, key: 'isAdmin', match: (value) => !value.isAdmin },
        ];
      })
    );
  }
}
