import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap } from 'rxjs';

import { AdminService, User, Workgroup } from '../services/admin.service';
import * as actions from './admin.actions';

@UntilDestroy()
@Injectable()
export class AdminEffects {
  private readonly actions$ = inject(Actions);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public findUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.findUser),
      switchMap(({ userId }) => {
        return this.adminService.getUser(userId).pipe(map((user) => actions.setUser({ user })));
      })
    );
  });

  public updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.updateUser),
      switchMap(({ user }) => {
        return this.adminService.updateUser(user).pipe(
          map((user: User) =>
            actions.setUser({
              user,
            })
          )
        );
      })
    )
  );

  public findWorkgroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.findWorkgroup),
      switchMap(({ workgroupId }) => {
        return this.adminService
          .getWorkgroup(workgroupId.toString())
          .pipe(map((workgroup: Workgroup) => actions.setWorkgroup({ workgroup })));
      })
    )
  );

  public createWorkgroup$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(actions.createWorkgroup),
        switchMap(({ workgroup }) => this.adminService.createWorkgroup(workgroup)),
        switchMap((workgroup) =>
          this.router.navigate([`/de/admin/workgroups/${workgroup.id}`], { relativeTo: this.route })
        )
      );
    },
    { dispatch: false }
  );

  public updateWorkgroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.updateWorkgroup),
      switchMap(({ workgroupId, workgroup }) => {
        return this.adminService
          .updateWorkgroups(workgroupId, workgroup)
          .pipe(map((workgroup: Workgroup) => actions.setWorkgroup({ workgroup })));
      })
    )
  );

  public listUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.listUsers, actions.setUser, actions.setWorkgroup),
      switchMap(() => {
        return this.adminService.getUsers().pipe(
          map((users: User[]) => {
            return actions.setUsers({ users });
          })
        );
      })
    )
  );

  public listWorkgroups$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.listWorkgroups, actions.setWorkgroup, actions.setUser),
      switchMap(() => {
        return this.adminService
          .getWorkgroups()
          .pipe(map((workgroups: Workgroup[]) => actions.setWorkgroups({ workgroups })));
      })
    )
  );
}
