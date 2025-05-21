import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Filter, fromAppShared, TranslationKey } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { SimpleWorkgroup, User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import { combineLatestWith, filter, map, Observable } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectSelectedUser, selectWorkgroups } from '../../state/admin.selector';
import { AbstractAdminTableComponent } from '../abstract-admin-table/abstract-admin-table.component';
import { AddWorkgroupToUserDialogComponent } from '../add-workgroup-to-user-dialog/add-workgroup-to-user-dialog.component';

export type WorkgroupOfUser = SimpleWorkgroup & { role: Role; isActive: boolean; numberOfAssets: number; lang: string };

@Component({
  selector: 'asset-sg-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  standalone: false,
})
export class UserEditComponent extends AbstractAdminTableComponent<WorkgroupOfUser> implements OnInit, OnDestroy {
  public roles = Object.values(Role);
  public languageSelector: TranslationKey[] = [
    { key: 'admin.languages.de' },
    { key: 'admin.languages.en' },
    { key: 'admin.languages.fr' },
    { key: 'admin.languages.it' },
  ];
  public user: User | null = null;
  public lang: TranslationKey = this.languageSelector[0];
  public workgroups: Workgroup[] = [];
  public isCurrentUser = false;
  protected readonly COLUMNS = ['name', 'numberOfAssets', 'role', 'isActive', 'actions'];
  public roleSelectors: Filter<WorkgroupOfUser>[] = [];

  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(MatDialog);
  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly workgroups$ = this.store.select(selectWorkgroups);
  private readonly user$ = this.store.select(selectSelectedUser);

  public readonly isCurrentUser$: Observable<boolean> = this.store.select(fromAppShared.selectRDUserProfile).pipe(
    map((currentUser) => (RD.isSuccess(currentUser) ? currentUser.value : null)),
    filter(isNotNull),
    combineLatestWith(this.user$.pipe(filter(isNotNull))),
    map(([currentUser, user]) => currentUser.id === user.id),
  );

  public readonly userWorkgroups$: Observable<WorkgroupOfUser[]> = this.user$.pipe(
    combineLatestWith(this.workgroups$),
    map(([user, workgroups]) => {
      if (user == null) {
        return [];
      }

      const result: WorkgroupOfUser[] = [];
      for (const workgroup of workgroups) {
        const role = user.roles.get(workgroup.id);
        if (role == null) {
          continue;
        }
        result.push({
          name: workgroup.name,
          id: workgroup.id,
          role,
          isActive: workgroup.disabledAt === null,
          numberOfAssets: workgroup.numberOfAssets,
          lang: user.lang,
        });
      }
      return result;
    }),
  );

  public override ngOnInit() {
    super.ngOnInit();
    this.roleSelectors = Object.values(Role).map((role) => ({
      displayValue: role,
      key: 'role',
      match: (value) => value.role === role,
    }));
    this.getUserFromRoute();
    this.initSubscriptions();
  }

  public override ngOnDestroy() {
    this.store.dispatch(actions.resetUser());
    super.ngOnDestroy();
  }

  public openAddWorkgroupToUserDialog() {
    this.dialogService.open<AddWorkgroupToUserDialogComponent>(AddWorkgroupToUserDialogComponent, {
      width: '400px',
      restoreFocus: false,
      data: {
        workgroups: this.workgroups,
        user: structuredClone(this.user),
      },
    });
  }

  public updateWorkgroupRole(role: Role[], workgroupId: WorkgroupId) {
    if (!this.user) {
      return;
    }
    const roles = new Map(this.user.roles);
    roles.set(workgroupId, role[0]);
    this.updateUser({ ...this.user, roles });
  }

  public removeWorkgroupRole(workgroupId: WorkgroupId) {
    if (!this.user) {
      return;
    }
    const roles = new Map(this.user.roles);
    roles.delete(workgroupId);
    this.updateUser({ ...this.user, roles });
  }

  public handleLanguageChanged(updatedValue: TranslationKey[]) {
    if (this.user) {
      this.updateUser({ ...this.user, lang: updatedValue[0].key.split('.')[2] });
    }
  }

  public handleIsAdminChanged(event: MatCheckboxChange) {
    if (this.user) {
      this.updateUser({ ...this.user, isAdmin: event.checked });
    }
  }

  private updateUser(user: User) {
    this.store.dispatch(actions.updateUser({ user }));
  }

  private getUserFromRoute() {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params: ParamMap) => {
        const userId = params.get('id');
        if (userId) {
          this.store.dispatch(actions.findUser({ userId }));
        }
      }),
    );
  }

  private initSubscriptions() {
    this.subscriptions.add(
      this.user$.subscribe((user) => {
        this.user = user;
        this.lang = user
          ? this.languageSelector.find((lang) => lang.key.includes(user.lang))!
          : this.languageSelector[0];
      }),
    );

    this.subscriptions.add(
      this.workgroups$.subscribe((workgroups) => {
        if (workgroups) {
          this.workgroups = workgroups;
        }
      }),
    );

    this.subscriptions.add(
      this.isCurrentUser$.subscribe((isCurrentUser) => {
        this.isCurrentUser = isCurrentUser;
      }),
    );

    this.subscriptions.add(
      this.userWorkgroups$.subscribe((userWorkgroups) => {
        this.data = userWorkgroups;
        this.dataSource.data = userWorkgroups;
      }),
    );
  }
}
