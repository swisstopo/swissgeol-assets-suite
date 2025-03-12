import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertType, appSharedStateActions, AuthService, CURRENT_LANG, showAlert } from '@asset-sg/client-shared';
import { User, Workgroup, WorkgroupData } from '@asset-sg/shared/v2';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, map, OperatorFunction, switchMap, withLatestFrom } from 'rxjs';

import { AdminService } from '../services/admin.service';
import * as actions from './admin.actions';

@UntilDestroy()
@Injectable()
export class AdminEffects {
  private readonly actions$ = inject(Actions);
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly currentLang$ = inject(CURRENT_LANG);
  private readonly translate = inject(TranslateService);

  public findUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.findUser),
      switchMap(({ userId }) => this.adminService.getUser(userId).pipe(map((user) => actions.setUser({ user }))))
    )
  );

  public updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.updateUser),
      switchMap(({ user }) => this.adminService.updateUser(user).pipe(map((user: User) => actions.setUser({ user }))))
    )
  );

  public findWorkgroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.findWorkgroup),
      switchMap(({ workgroupId }) =>
        this.adminService
          .getWorkgroup(workgroupId.toString())
          .pipe(map((workgroup: Workgroup) => actions.setWorkgroup({ workgroup })))
      )
    )
  );

  public createWorkgroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.createWorkgroup),
      switchMap(({ workgroup }) =>
        this.adminService.createWorkgroup(workgroup).pipe(this.catchWorkgroupError(workgroup))
      ),
      withLatestFrom(this.currentLang$),
      map(([workgroup, currentLang]) => {
        void this.router.navigate([`/${currentLang}/admin/workgroups/${workgroup.id}`], { relativeTo: this.route });
        return actions.addWorkgroup({ workgroup });
      })
    )
  );

  public updateWorkgroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.updateWorkgroup),
      switchMap(({ workgroupId, workgroup }) =>
        this.adminService.updateWorkgroup(workgroupId, workgroup).pipe(this.catchWorkgroupError(workgroup))
      ),
      map((workgroup: Workgroup) => actions.setWorkgroup({ workgroup }))
    )
  );

  public deleteWorkgroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.deleteWorkgroup),
      switchMap(({ workgroupId }) =>
        this.adminService
          .deleteWorkgroup(workgroupId)
          .pipe(map(() => actions.removeWorkgroupAfterDelete({ workgroupId })))
      )
    )
  );

  public listUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.listUsers, actions.setUser),
      switchMap(() => this.adminService.getUsers().pipe(map((users: User[]) => actions.setUsers({ users }))))
    )
  );

  public listWorkgroups$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.listWorkgroups, actions.setWorkgroup),
      switchMap(() =>
        this.adminService.getWorkgroups().pipe(map((workgroups: Workgroup[]) => actions.setWorkgroups({ workgroups })))
      )
    )
  );

  public loadUser$ = createEffect(() =>
    this.actions$.pipe(ofType(actions.setUser, actions.setWorkgroup), map(appSharedStateActions.loadUserProfile))
  );

  private readonly catchWorkgroupError = (data: WorkgroupData): OperatorFunction<Workgroup, Workgroup> =>
    catchError((error) => {
      if (!(error instanceof HttpErrorResponse)) {
        throw error;
      }
      if (
        error.status === 422 &&
        error.error.message === 'Unique constraint failed' &&
        error.error.details.fields.includes('name')
      ) {
        this.store.dispatch(
          showAlert({
            alert: {
              id: `duplicate-workgroup-name`,
              text: this.translate.get('workgroup.errors.nameTaken', { name: data.name }),
              type: AlertType.Error,
              isPersistent: false,
            },
          })
        );
        return EMPTY;
      }
      throw error;
    });
}
