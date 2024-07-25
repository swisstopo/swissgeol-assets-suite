import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CURRENT_LANG } from '@asset-sg/client-shared';
import { User, Workgroup } from '@asset-sg/shared/v2';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { first, map, switchMap, tap, withLatestFrom } from 'rxjs';

import { AdminService } from '../services/admin.service';
import * as actions from './admin.actions';

@UntilDestroy()
@Injectable()
export class AdminEffects {
  private readonly actions$ = inject(Actions);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly currentLang$ = inject(CURRENT_LANG);

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
      switchMap(({ workgroup }) => this.adminService.createWorkgroup(workgroup)),
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
        this.adminService
          .updateWorkgroup(workgroupId, workgroup)
          .pipe(map((workgroup: Workgroup) => actions.setWorkgroup({ workgroup })))
      )
    )
  );

  public listUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.listUsers, actions.setUser, actions.setWorkgroup),
      first(),
      switchMap(() => this.adminService.getUsers().pipe(map((users: User[]) => actions.setUsers({ users }))))
    )
  );

  public listWorkgroups$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.listWorkgroups, actions.setWorkgroup, actions.setUser),
      first(),
      switchMap(() =>
        this.adminService.getWorkgroups().pipe(map((workgroups: Workgroup[]) => actions.setWorkgroups({ workgroups })))
      )
    )
  );
}
