import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User, UserId, Workgroup, WorkgroupData } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import { Observable, Subscription } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers } from '../../state/admin.selector';
import { Mode } from '../workgroup-edit/workgroup-edit.component';

@Component({
  selector: 'asset-sg-add-users-to-workgroup-dialog',
  templateUrl: './add-users-to-workgroup-dialog.component.html',
  styleUrls: ['./add-users-to-workgroup-dialog.component.scss'],
  standalone: false,
})
export class AddUsersToWorkgroupDialogComponent implements OnInit {
  public users: User[] = [];
  public userValues: string[] = [];
  public usersOnWorkgroup: User[] = [];
  public workgroup: Workgroup;
  public mode: Mode;
  public roles = Object.values(Role);
  public shouldShowError = false;
  private selectedUserIds: UserId[] = [];
  public selectedRole: Role = Role.Viewer;

  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly users$: Observable<User[]> = this.store.select(selectUsers);
  private readonly subscriptions: Subscription = new Subscription();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { workgroup: Workgroup; mode: Mode },
    private readonly dialogRef: MatDialogRef<AddUsersToWorkgroupDialogComponent>,
  ) {
    this.workgroup = this.data.workgroup;
    this.mode = this.data.mode;
  }

  public ngOnInit() {
    this.initSubscriptions();
  }

  public close() {
    this.dialogRef.close();
  }

  public setSelectedRole(role: Role[]) {
    this.selectedRole = role[0];
  }

  public setSelectedUsers(selectedUsers: string[]) {
    this.selectedUserIds = this.users.filter((user) => selectedUsers.includes(user.email)).map((user) => user.id);
  }

  public addUsersToWorkgroup() {
    if (this.selectedUserIds.length === 0) {
      this.shouldShowError = true;
      return;
    }
    const users = new Map(this.workgroup.users);
    const newUserIds = this.selectedUserIds;
    for (const user of this.usersOnWorkgroup) {
      if (!newUserIds.includes(user.id)) {
        continue;
      }
      users.set(user.id, {
        email: user.email,
        role: this.selectedRole,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
    const workgroup: WorkgroupData = {
      name: this.workgroup.name,
      disabledAt: this.workgroup.disabledAt,
      users,
    };
    if (this.mode === 'edit') {
      this.store.dispatch(actions.updateWorkgroup({ workgroupId: this.workgroup.id, workgroup }));
    } else {
      this.store.dispatch(actions.setWorkgroup({ workgroup: { ...workgroup, id: -1, numberOfAssets: 0 } }));
    }
    this.shouldShowError = false;
    this.dialogRef.close();
  }

  private initSubscriptions() {
    this.subscriptions.add(
      this.users$.subscribe((users) => {
        this.usersOnWorkgroup = users;
        this.users = users.filter((user) => !this.workgroup.users.has(user.id));
        this.userValues = this.users.map((user) => user.email);
      }),
    );
  }
}
