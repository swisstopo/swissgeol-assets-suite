import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
  selector: 'asset-sg-add-workgroup-user-dialog',
  templateUrl: './add-workgroup-user-dialog.component.html',
  styleUrls: ['./add-workgroup-user-dialog.component.scss'],
  standalone: false,
})
export class AddWorkgroupUserDialogComponent implements OnInit {
  public formGroup = new FormGroup({
    users: new FormControl<UserId[]>([], { validators: [Validators.required], nonNullable: true }),
    role: new FormControl(Role.Viewer, { validators: [Validators.required], nonNullable: true }),
  });

  private readonly store = inject(Store<AppStateWithAdmin>);

  public readonly roles: Role[] = Object.values(Role);

  public users: User[] = [];
  public workgroup: Workgroup;
  public mode: Mode;

  private readonly users$: Observable<User[]> = this.store.select(selectUsers);
  private readonly subscriptions: Subscription = new Subscription();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { workgroup: Workgroup; mode: Mode },
    private readonly dialogRef: MatDialogRef<AddWorkgroupUserDialogComponent>
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
    if (this.formGroup.invalid) {
      return;
    }
    const users = new Map(this.workgroup.users);
    const newUserIds = new Set(this.formGroup.controls.users.value);
    for (const user of this.users) {
      if (!newUserIds.has(user.id)) {
        continue;
      }
      users.set(user.id, {
        email: user.email,
        role: this.formGroup.controls['role'].value,
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
      this.store.dispatch(actions.setWorkgroup({ workgroup: { ...workgroup, id: -1 } }));
    }
    this.dialogRef.close();
  }

  public isUserInWorkgroup(userId: string): boolean {
    return this.workgroup.users.has(userId);
  }

  private initSubscriptions() {
    this.subscriptions.add(this.users$.subscribe((users) => (this.users = users)));
  }
}
