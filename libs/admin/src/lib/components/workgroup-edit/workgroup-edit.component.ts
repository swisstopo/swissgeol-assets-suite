import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { UserId, UserOnWorkgroup, Workgroup, WorkgroupData } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import { BehaviorSubject, map, share, startWith, Subscription } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectSelectedWorkgroup } from '../../state/admin.selector';
import { AddWorkgroupUserDialogComponent } from '../add-workgroup-user-dialog/add-workgroup-user-dialog.component';

export type Mode = 'edit' | 'create';

@Component({
  selector: 'asset-sg-workgroup-edit',
  templateUrl: './workgroup-edit.component.html',
  styleUrls: ['./workgroup-edit.component.scss'],
  standalone: false,
})
export class WorkgroupEditComponent implements OnInit, OnDestroy {
  public workgroup$ = new BehaviorSubject<Workgroup | null>(null);
  public mode: Mode = 'edit';

  public readonly roles: Role[] = Object.values(Role);
  public readonly formGroup = new FormGroup({
    name: new FormControl('', { validators: Validators.required, updateOn: 'blur', nonNullable: true }),
    isDisabled: new FormControl(false, { nonNullable: true }),
    users: new FormControl<Map<UserId, UserOnWorkgroup>>(new Map(), { nonNullable: true }),
  });

  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(MatDialog);
  private readonly subscriptions: Subscription = new Subscription();
  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly router = inject(Router);
  private readonly selectedWorkgroup$ = this.store.select(selectSelectedWorkgroup);

  public readonly users$ = this.workgroup$.pipe(
    map((workgroup) => {
      if (workgroup == null) {
        return [];
      }
      const users: Array<UserOnWorkgroup & { id: UserId }> = [];
      for (const [id, user] of workgroup.users) {
        users.push({ ...user, id });
      }
      return users;
    }),
    startWith([]),
    share()
  );

  public ngOnInit() {
    this.loadWorkgroupFromRouteParams();
    this.initializeSubscriptions();
  }

  public ngOnDestroy() {
    this.store.dispatch(actions.resetWorkgroup());
    this.subscriptions.unsubscribe();
  }

  private get workgroup(): Workgroup | null {
    return this.workgroup$.value;
  }

  public initializeForm(workgroup: Workgroup) {
    this.formGroup.patchValue(
      {
        name: workgroup.name,
        isDisabled: workgroup.disabledAt != null,
        users: workgroup.users,
      },
      { emitEvent: false }
    );
  }

  private initializeSubscriptions() {
    this.subscriptions.add(
      this.selectedWorkgroup$.subscribe((workgroup) => {
        if (workgroup) {
          this.workgroup$.next(workgroup);
          this.initializeForm(workgroup);
        }
      })
    );

    this.subscriptions.add(
      this.formGroup.valueChanges.subscribe(() => {
        if (this.workgroup == null || this.formGroup.pristine) {
          return;
        }
        this.updateWorkgroup(this.workgroup.id, {
          name: this.formGroup.controls.name.value ?? '',
          disabledAt: this.formGroup.controls.isDisabled.value ? this.workgroup?.disabledAt ?? new Date() : null,
          users: this.workgroup.users,
        });
      })
    );
  }

  public updateRoleForUser(event: MatSelectChange, userId: UserId, user: UserOnWorkgroup) {
    if (this.workgroup == null) {
      return;
    }
    const users = new Map(this.workgroup.users);
    users.set(userId, {
      email: user.email,
      role: event.value as Role,
    });
    this.updateWorkgroup(this.workgroup.id, {
      ...this.workgroup,
      users,
    });
  }

  public addUsersToWorkgroup() {
    this.dialogService.open<AddWorkgroupUserDialogComponent>(AddWorkgroupUserDialogComponent, {
      width: '400px',
      restoreFocus: false,
      data: {
        workgroup: this.workgroup,
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

  public cancel() {
    this.router.navigate(['../'], { relativeTo: this.route }).then();
    this.store.dispatch(actions.resetWorkgroup());
  }

  public createWorkgroup() {
    if (this.workgroup == null || !this.formGroup.valid) {
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
        ...workgroup,
      });
    }
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
          });
        }
      })
    );
  }
}
