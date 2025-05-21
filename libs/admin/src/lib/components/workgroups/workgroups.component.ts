import { Component, inject, OnInit } from '@angular/core';
import { Filter } from '@asset-sg/client-shared';
import { User, Workgroup } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
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
  extends AbstractAdminTableComponent<
    Workgroup & {
      usersPerRole: UsersPerRole;
    }
  >
  implements OnInit
{
  protected readonly COLUMNS = ['name', 'numberOfAssets', 'users', 'status', 'actions'];
  public users: User[] = [];

  private readonly store = inject(Store<AppStateWithAdmin>);
  public filterForIsActive: Filter<Workgroup>[] = [
    { displayValue: { key: 'admin.workgroupPage.isActive' }, key: 'disabledAt', match: (value) => !value.disabledAt },
    {
      displayValue: { key: 'admin.workgroupPage.isDisabled' },
      key: 'disabledAt',
      match: (value) => !!value.disabledAt,
    },
  ];
  private readonly users$ = this.store.select(selectUsers);
  readonly workgroups$ = this.store.select(selectWorkgroups);

  public override ngOnInit(): void {
    super.ngOnInit();
    this.store.dispatch(actions.listWorkgroups());
    this.initSubscriptions();
  }

  protected override matchBySearchTerm(workgroup: Workgroup, searchTerm: string): boolean {
    return workgroup.name.toLowerCase().includes(searchTerm.toLowerCase());
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
      this.workgroups$.subscribe((workgroups) => {
        this.data = workgroups.map((workgroup) => {
          const usersPerRole = this.getNumberOfUsersPerRoleForWorkgroup(workgroup);
          return { ...workgroup, usersPerRole };
        });
        this.dataSource.data = this.data;
      }),
    );
    this.subscriptions.add(
      this.users$.subscribe((users) => {
        this.users = users;
      }),
    );
  }
}
