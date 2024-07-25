import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { Role, User, UserOnWorkgroup, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { filter, map, Observable, startWith, Subscription, withLatestFrom } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers, selectWorkgroups } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  public workgroups = new Map<WorkgroupId, Workgroup>();

  protected readonly COLUMNS = ['email', 'isAdmin', 'languages', 'workgroups', 'actions'];
  protected readonly WORKGROUP_DISPLAY_COUNT = 3;

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

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
    for (const [workgroupId, workgroupRole] of roles) {
      const workgroup = this.workgroups.get(workgroupId);
      if (workgroup == null) {
        continue;
      }
      if (tooltip.length !== 0) {
        tooltip += ',\n';
      }
      tooltip += `${workgroup.name}.${workgroupRole}`;
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
  }
}
