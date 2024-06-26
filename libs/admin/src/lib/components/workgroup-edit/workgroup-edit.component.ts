import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import { map, Subscription } from 'rxjs';
import { UserOnWorkgroup, Workgroup, WorkgroupData } from '../../services/admin.service';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectSelectedWorkgroup } from '../../state/admin.selector';
import { AddWorkgroupUserDialog } from '../add-workgroup-user-dialog/add-workgroup-user-dialog.component';

export type Mode = 'edit' | 'create';

@Component({
  selector: 'asset-sg-workgroup-edit',
  templateUrl: './workgroup-edit.component.html',
  styleUrls: ['./workgroup-edit.component.scss'],
})
export class WorkgroupEditComponent implements OnInit, OnDestroy {
  public workgroup: Workgroup | undefined;
  public mode: Mode = 'edit';

  public readonly roles: Role[] = Object.values(Role);
  public readonly formGroup: FormGroup = new FormGroup({
    name: new FormControl('', { validators: Validators.required, updateOn: 'blur' }),
    status: new FormControl(),
    users: new FormControl([]),
  });

  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(MatDialog);
  private readonly subscriptions: Subscription = new Subscription();
  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly router = inject(Router);
  private readonly workgroup$ = this.store.select(selectSelectedWorkgroup);

  public ngOnInit() {
    this.findWorkgroupFromRouteParams();
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.store.dispatch(actions.resetWorkgroup());
    this.subscriptions.unsubscribe();
  }

  public initializeForm(workgroup: Workgroup) {
    this.formGroup.patchValue(
      {
        name: workgroup.name,
        status: !!workgroup.disabled_at,
        users: workgroup.users,
      },
      { emitEvent: false }
    );
  }

  public updateRoleForUser(event: MatSelectChange, user: UserOnWorkgroup) {
    if (!this.workgroup) {
      return;
    }
    const updatedUsers: UserOnWorkgroup[] = this.workgroup.users.map((u) =>
      u.user.id === user.user.id
        ? {
            ...u,
            role: event.value,
          }
        : u
    );
    const updatedWorkgroup = {
      name: this.workgroup.name,
      assets: this.workgroup.assets,
      disabled_at: this.workgroup.disabled_at,
      users: updatedUsers,
    };
    this.updateWorkgroup(this.workgroup.id, updatedWorkgroup);
  }

  public addUsersToWorkgroup() {
    this.dialogService.open<AddWorkgroupUserDialog>(AddWorkgroupUserDialog, {
      width: '400px',
      restoreFocus: false,
      data: {
        workgroup: this.workgroup,
        mode: this.mode,
      },
    });
  }

  public deleteUserFromWorkgroup(user: UserOnWorkgroup) {
    if (!this.workgroup) {
      return;
    }
    const updatedWorkgroup = {
      name: this.workgroup.name,
      assets: this.workgroup.assets,
      disabled_at: this.workgroup.disabled_at,
      users: this.workgroup.users.filter((u) => u.user.id !== user.user.id),
    };
    this.updateWorkgroup(this.workgroup.id, updatedWorkgroup);
  }

  public cancel() {
    void this.router.navigate(['../'], { relativeTo: this.route });
    this.store.dispatch(actions.resetWorkgroup());
  }

  public createWorkGroup() {
    if (!this.workgroup || !this.formGroup.valid) {
      return;
    }
    const { id, ...workgroup } = this.workgroup;
    this.store.dispatch(actions.createWorkgroup({ workgroup }));
  }

  private updateWorkgroup(workgroupId: number, workgroup: WorkgroupData) {
    if (this.mode === 'edit') {
      this.store.dispatch(actions.updateWorkgroup({ workgroupId, workgroup }));
    } else {
      this.workgroup = {
        id: workgroupId,
        ...workgroup,
      };
    }
  }

  private findWorkgroupFromRouteParams() {
    this.subscriptions.add(
      this.route.paramMap
        .pipe(
          map((params: ParamMap) => {
            const id = params.get('id');
            if (id) {
              this.mode = 'edit';
              return this.store.dispatch(actions.findWorkgroup({ workgroupId: parseInt(id) }));
            } else {
              this.mode = 'create';
              this.workgroup = {
                id: 0,
                name: '',
                users: [],
                assets: [],
                disabled_at: null,
              };
            }
          })
        )
        .subscribe()
    );
  }

  private initSubscriptions() {
    this.subscriptions.add(
      this.workgroup$.subscribe((workgroup) => {
        if (workgroup) {
          this.workgroup = workgroup;
          this.initializeForm(workgroup);
        }
      })
    );

    this.subscriptions.add(
      this.formGroup.valueChanges.subscribe((value) => {
        if (!this.workgroup) {
          return;
        }
        const updatedWorkgroup = {
          name: value.name,
          disabled_at: value.status ? new Date() : null,
          assets: this.workgroup.assets,
          users: this.workgroup.users,
        };
        this.updateWorkgroup(this.workgroup.id, updatedWorkgroup);
      })
    );
  }
}
