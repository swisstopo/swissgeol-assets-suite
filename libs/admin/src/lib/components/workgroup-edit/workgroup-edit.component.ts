import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Filter } from '@asset-sg/client-shared';
import { User, UserId, UserOnWorkgroup, Workgroup, WorkgroupData } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import { BehaviorSubject, map } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectSelectedWorkgroup } from '../../state/admin.selector';
import { AbstractAdminTableComponent } from '../abstract-admin-table/abstract-admin-table.component';
import { AddUsersToWorkgroupDialogComponent } from '../add-users-to-workgroup-dialog/add-users-to-workgroup-dialog.component';

export type Mode = 'edit' | 'create';

@Component({
  selector: 'asset-sg-workgroup-edit',
  templateUrl: './workgroup-edit.component.html',
  styleUrls: ['./workgroup-edit.component.scss'],
  standalone: false,
})
export class WorkgroupEditComponent
  extends AbstractAdminTableComponent<
    UserOnWorkgroup & {
      id: UserId;
    }
  >
  implements OnInit, OnDestroy
{
  public roles: Role[] = Object.values(Role);
  public roleSelectors: Filter<
    UserOnWorkgroup & {
      id: UserId;
    }
  >[] = [];
  public readonly COLUMNS = ['firstName', 'lastName', 'email', 'role', 'actions'];
  public workgroup$ = new BehaviorSubject<Workgroup | null>(null);
  public mode: Mode = 'edit';

  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(MatDialog);
  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly router = inject(Router);
  private readonly selectedWorkgroup$ = this.store.select(selectSelectedWorkgroup);

  public override ngOnInit() {
    super.ngOnInit();
    this.roleSelectors = Object.values(Role).map((role) => ({
      displayValue: role,
      key: 'role',
      match: (value) => value.role === role,
    }));
    this.loadWorkgroupFromRouteParams();
    this.initializeSubscriptions();
  }

  public override ngOnDestroy() {
    this.store.dispatch(actions.resetWorkgroup());
    super.ngOnDestroy();
  }

  public get workgroup(): Workgroup | null {
    return this.workgroup$.value;
  }

  public updateWorkgroupRole(role: string[], userId: UserId, user: User) {
    if (!this.workgroup) {
      return;
    }
    const users = new Map(this.workgroup.users);
    users.set(userId, {
      email: user.email,
      role: role[0] as Role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    this.updateWorkgroup(this.workgroup.id, {
      ...this.workgroup,
      users,
    });
  }

  public updateWorkgroupName(name: string) {
    if (!this.workgroup) {
      return;
    }
    this.updateWorkgroup(this.workgroup.id, {
      ...this.workgroup,
      name,
    });
  }

  public addUsersToWorkgroup() {
    this.dialogService.open<AddUsersToWorkgroupDialogComponent>(AddUsersToWorkgroupDialogComponent, {
      width: '400px',
      restoreFocus: false,
      data: {
        workgroup: this.workgroup,
        users: this.data,
        mode: this.mode,
      },
    });
  }

  public deleteUserFromWorkgroup(userId: UserId) {
    if (this.workgroup == null) {
      return;
    }
    const users = new Map(this.workgroup.users);
    users.delete(userId);
    this.updateWorkgroup(this.workgroup.id, {
      ...this.workgroup,
      users,
    });
  }

  public readonly users$ = this.workgroup$.pipe(
    map((workgroup) => {
      if (workgroup == null) {
        return [];
      }
      const users: Array<UserOnWorkgroup & { id: UserId }> = [];
      for (const [id, user] of workgroup.users) {
        users.push({ ...user, id });
      }
      this.data = users;
      this.dataSource.data = users;
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
      });
      return users;
    })
  );

  public cancel() {
    this.router.navigate(['../'], { relativeTo: this.route }).then();
    this.store.dispatch(actions.resetWorkgroup());
  }

  public createWorkgroup() {
    if (this.workgroup == null) {
      return;
    }
    const { id: _id, ...workgroup } = this.workgroup;
    this.store.dispatch(actions.createWorkgroup({ workgroup }));
  }

  private updateWorkgroup(workgroupId: number, workgroup: WorkgroupData) {
    if (this.mode === 'edit') {
      this.store.dispatch(actions.updateWorkgroup({ workgroupId, workgroup }));
    } else {
      this.workgroup$.next({
        id: workgroupId,
        numberOfAssets: 0,
        ...workgroup,
      });
    }
  }

  private initializeSubscriptions() {
    this.subscriptions.add(this.users$.subscribe());
    this.subscriptions.add(
      this.selectedWorkgroup$.subscribe((workgroup) => {
        if (workgroup) {
          this.workgroup$.next(workgroup);
        }
      })
    );
  }

  private loadWorkgroupFromRouteParams() {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params: ParamMap) => {
        const id = params.get('id');
        if (id) {
          this.mode = 'edit';
          return this.store.dispatch(actions.findWorkgroup({ workgroupId: parseInt(id) }));
        } else {
          this.mode = 'create';
          this.workgroup$.next({
            id: 0,
            name: '',
            users: new Map(),
            disabledAt: null,
            numberOfAssets: 0,
          });
        }
      })
    );
  }
}
