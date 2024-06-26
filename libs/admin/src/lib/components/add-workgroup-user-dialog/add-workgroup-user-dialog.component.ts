import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import { Observable, Subscription } from 'rxjs';
import { User, Workgroup } from '../../services/admin.service';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectUsers } from '../../state/admin.selector';
import { Mode } from '../workgroup-edit/workgroup-edit.component';

@Component({
  selector: 'asset-sg-add-workgroup-user-dialog',
  templateUrl: './add-workgroup-user-dialog.component.html',
  styleUrls: ['./add-workgroup-user-dialog.component.scss'],
})
export class AddWorkgroupUserDialog implements OnInit {
  public formGroup: FormGroup = new FormGroup({
    users: new FormControl([], Validators.required),
    role: new FormControl(Role.Viewer, Validators.required),
  });

  public users: User[] = [];
  public workgroup: Workgroup;
  public mode: Mode = 'edit';
  public readonly roles: Role[] = Object.values(Role);

  private readonly users$: Observable<User[]> = this.store.select(selectUsers);
  private readonly subscriptions: Subscription = new Subscription();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { workgroup: Workgroup; mode: Mode },
    private readonly dialogRef: MatDialogRef<AddWorkgroupUserDialog>,
    private store: Store<AppStateWithAdmin>
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

  public addUsers() {
    if (!this.formGroup.valid) {
      return;
    }
    const usersToAdd = this.users
      .filter((user) => this.formGroup.controls['users'].value.includes(user.id))
      .map((user) => ({
        user: { email: user.email, id: user.id },
        role: this.formGroup.controls['role'].value,
      }));
    const updatedWorkgroup = {
      name: this.workgroup.name,
      assets: this.workgroup.assets,
      disabled_at: this.workgroup.disabled_at,
      users: [...usersToAdd, ...this.workgroup.users],
    };
    if (this.mode === 'edit') {
      this.store.dispatch(actions.updateWorkgroup({ workgroupId: this.workgroup.id, workgroup: updatedWorkgroup }));
    } else {
      this.store.dispatch(actions.setWorkgroup({ workgroup: { ...updatedWorkgroup, id: 0 } }));
    }
    this.dialogRef.close();
  }

  public isUserInWorkgroup(userId: string): boolean {
    return this.workgroup.users.some((user) => user.user.id === userId) ?? false;
  }

  private initSubscriptions() {
    this.subscriptions.add(this.users$.subscribe((users) => (this.users = users)));
  }
}
