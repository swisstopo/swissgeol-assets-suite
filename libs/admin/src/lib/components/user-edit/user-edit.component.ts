import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Filter, fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { Lang } from '@asset-sg/shared';
import { SimpleWorkgroup, User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import { combineLatestWith, filter, map, Observable, Subscription, tap } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectSelectedUser, selectWorkgroups } from '../../state/admin.selector';
import { AbstractAdminTableComponent } from '../abstract-admin-table/abstract-admin-table.component';
import { AddWorkgroupToUserDialogComponent } from '../add-workgroup-to-user-dialog/add-workgroup-to-user-dialog.component';

export type WorkgroupOfUser = SimpleWorkgroup & { role: Role; isActive: boolean; numberOfAssets: number };

@Component({
  selector: 'asset-sg-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  standalone: false,
})
export class UserEditComponent
  extends AbstractAdminTableComponent<WorkgroupOfUser, User, Role>
  implements OnInit, OnDestroy, AfterViewInit
{
  public roles = Object.values(Role);
  public user: User | null = null;
  public workgroups: Workgroup[] = [];
  public isCurrentUser = false;
  public userWorkgroups: WorkgroupOfUser[] = [];

  protected readonly COLUMNS = ['name', 'numberOfAssets', 'role', 'isActive', 'actions'];
  languageSelector: Filter<Lang>[] = [
    { displayValue: { key: 'admin.languages.de' }, value: 'de' },
    { displayValue: { key: 'admin.languages.en' }, value: 'en' },
    { displayValue: { key: 'admin.languages.fr' }, value: 'fr' },
    { displayValue: { key: 'admin.languages.it' }, value: 'en' },
  ];

  public roleSelectors: Filter<Role>[] = [];

  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(MatDialog);
  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly workgroups$ = this.store.select(selectWorkgroups);
  private readonly user$ = this.store.select(selectSelectedUser);
  private readonly subscriptions: Subscription = new Subscription();

  public readonly isCurrentUser$: Observable<boolean> = this.store.select(fromAppShared.selectRDUserProfile).pipe(
    map((currentUser) => (RD.isSuccess(currentUser) ? currentUser.value : null)),
    filter(isNotNull),
    combineLatestWith(this.user$.pipe(filter(isNotNull))),
    map(([currentUser, user]) => currentUser.id === user.id)
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
        });
      }
      return result;
    })
  );

  public ngOnInit() {
    this.roleSelectors = Object.values(Role).map((role) => ({ displayValue: role, value: role }));
    this.getUserFromRoute();
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public override ngAfterViewInit() {
    super.ngAfterViewInit();
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

  protected matchByFilters(
    workgroup: WorkgroupOfUser,
    filters: Map<keyof User, (string | number | boolean)[]>
  ): boolean {
    return Array.from(filters.values()).every((values) => {
      if (values.length === 0) {
        return true;
      }
      return values.some((value) => {
        return value === workgroup.role;
      });
    });
  }

  public updateWorkgroupRole(role: Filter<Role>[], workgroupId: WorkgroupId) {
    if (!this.user) {
      return;
    }
    const roles = new Map(this.user.roles);
    roles.set(workgroupId, role[0].value);
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

  public handleLanguageChanged(updatedValue: Filter<string>[]) {
    if (this.user) {
      this.updateUser({ ...this.user, lang: updatedValue[0].value });
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
      })
    );
  }

  private initSubscriptions() {
    this.subscriptions.add(
      this.user$.subscribe((user) => {
        this.user = user;
      })
    );

    this.subscriptions.add(
      this.workgroups$.subscribe((workgroups) => {
        if (workgroups) {
          this.workgroups = workgroups;
        }
      })
    );

    this.subscriptions.add(
      this.isCurrentUser$.subscribe((isCurrentUser) => {
        this.isCurrentUser = isCurrentUser;
      })
    );

    this.subscriptions.add(
      this.userWorkgroups$.subscribe((userWorkgroups) => {
        this.userWorkgroups = userWorkgroups;
        this.dataSource.data = userWorkgroups;
      })
    );

    this.subscriptions.add(
      this.searchTerm$
        .pipe(
          combineLatestWith(this.activeFilters$),
          tap(([term, filters]) => {
            this.dataSource.data = this.userWorkgroups.filter((workgroup) => {
              return this.matchBySearchTerm(workgroup, term) && this.matchByFilters(workgroup, filters);
            });
          })
        )
        .subscribe()
    );
  }
}
