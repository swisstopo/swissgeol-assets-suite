import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { User, Workgroup, WorkgroupOnUser } from '../../services/admin.service';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers, selectWorkgroups } from '../../state/admin.selector';

const WORKGROUP_CUTOFF_LENGTH = 3;

@Component({
  selector: 'asset-sg-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  public users: User[] = [];
  public workgroups: Workgroup[] = [];
  public readonly workgroupCutoffLength = WORKGROUP_CUTOFF_LENGTH;

  protected readonly COLUMNS = ['email', 'isAdmin', 'languages', 'workgroups', 'actions'];

  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly users$ = this.store.select(selectUsers);
  private readonly workgroups$ = this.store.select(selectWorkgroups);
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public updateIsAdminStatus(user: User, event: MatCheckboxChange) {
    this.store.dispatch(actions.updateUser({ user: { ...user, isAdmin: event.checked } }));
  }

  public formatWorkgroupsTooltip(workgroups: WorkgroupOnUser[]): string {
    return workgroups.map((wg) => `${wg.workgroup.name}.${wg.role}`).join(', \n');
  }

  private initSubscriptions(): void {
    this.subscriptions.add(
      this.users$.subscribe((users) => {
        this.users = users;
      })
    );
    this.subscriptions.add(
      this.workgroups$.subscribe((workgroups) => {
        this.workgroups = workgroups;
      })
    );
  }
}
