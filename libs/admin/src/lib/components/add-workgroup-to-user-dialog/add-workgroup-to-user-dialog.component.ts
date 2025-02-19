import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Filter } from '@asset-sg/client-shared';
import { User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';

@Component({
  selector: 'asset-sg-add-workgroup-to-user-dialog',
  templateUrl: './add-workgroup-to-user-dialog.component.html',
  styleUrls: ['./add-workgroup-to-user-dialog.component.scss'],
  standalone: false,
})
export class AddWorkgroupToUserDialogComponent {
  public user?: User;
  public workgroups: Filter<WorkgroupId>[] = [];
  public roleSelectors: Filter<Role>[] = [];
  public shouldShowError = false;
  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly dialogRef = inject(MatDialogRef<AddWorkgroupToUserDialogComponent>);
  private readonly data = inject<{ workgroups: Workgroup[]; user: User | null }>(MAT_DIALOG_DATA);
  private selectedWorkgroupIds: WorkgroupId[] = [];
  public selectedRole: Role = Role.Viewer;

  constructor() {
    this.user = this.data.user ?? undefined;
    this.workgroups = this.data.workgroups
      .filter((workgroup) => !this.user?.roles.has(workgroup.id))
      .map((workgroup) => ({
        displayValue: workgroup.name,
        value: workgroup.id,
      }));
    this.roleSelectors = Object.values(Role).map((role) => ({ displayValue: role, value: role }));
  }

  public setSelectedRole(role: Filter<Role>[]) {
    this.selectedRole = role[0].value;
  }

  public setSelectedWorkgroups(selectedWorkgroups: Filter<WorkgroupId>[]) {
    this.selectedWorkgroupIds = selectedWorkgroups.map((workgroup) => workgroup.value);
  }

  public close() {
    this.dialogRef.close();
  }

  public updateWorkgroupsOfUser() {
    if (this.selectedWorkgroupIds.length === 0) {
      this.shouldShowError = true;
      return;
    }
    if (this.user == null) {
      return;
    }
    const roles = this.user.roles;
    for (const workgroupId of this.selectedWorkgroupIds) {
      roles.set(workgroupId, this.selectedRole);
    }
    this.store.dispatch(actions.updateUser({ user: { ...this.user, roles } }));
    this.shouldShowError = false;
    this.dialogRef.close();
  }

  protected readonly Role = Role;
}
