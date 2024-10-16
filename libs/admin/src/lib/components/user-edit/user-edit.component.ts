import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatOptionSelectionChange } from '@angular/material/core';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { SimpleWorkgroup, User, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import { asapScheduler, filter, map, Observable, startWith, Subscription, withLatestFrom } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectSelectedUser } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
})
export class UserEditComponent implements OnInit, OnDestroy {
  public roles = Object.values(Role);
  public user: User | null = null;
  public workgroups: SimpleWorkgroup[] = [];
  public filteredWorkgroups: SimpleWorkgroup[] = [];

  public workgroupAutoCompleteControl = new FormControl('');
  public formGroup = new FormGroup({
    isAdmin: new FormControl(false),
    lang: new FormControl('de'),
  });

  protected readonly COLUMNS = ['name', 'role', 'actions'];

  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly workgroups$ = this.store.select(fromAppShared.selectWorkgroups);
  private readonly user$ = this.store.select(selectSelectedUser);
  private readonly subscriptions: Subscription = new Subscription();

  public readonly isCurrentUser$: Observable<boolean> = this.store.select(fromAppShared.selectRDUserProfile).pipe(
    map((currentUser) => (RD.isSuccess(currentUser) ? currentUser.value : null)),
    filter(isNotNull),
    withLatestFrom(this.user$.pipe(filter(isNotNull))),
    map(([currentUser, user]) => currentUser.id === user.id),
    startWith(true)
  );

  public readonly userWorkgroups$: Observable<Array<SimpleWorkgroup & { role: Role }>> = this.user$.pipe(
    withLatestFrom(this.workgroups$),
    map(([user, workgroups]) => {
      if (user == null) {
        return [];
      }
      const result: Array<SimpleWorkgroup & { role: Role }> = [];
      for (const workgroup of workgroups) {
        const role = user.roles.get(workgroup.id);
        if (role == null) {
          continue;
        }
        result.push({ ...workgroup, role });
      }
      return result;
    })
  );

  public ngOnInit() {
    this.getUserFromRoute();
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public resetWorkgroupSearch() {
    this.workgroupAutoCompleteControl.setValue('');

    // Redo the reset a tick later, as the input seems to fall back to its previous value.
    asapScheduler.schedule(() => {
      this.workgroupAutoCompleteControl.setValue('');
    });
  }

  public isUserPartOfWorkgroup(workgroupId: number): boolean {
    return this.user?.roles?.has(workgroupId) ?? false;
  }

  public addWorkgroupRole(event: MatOptionSelectionChange, workgroupId: number) {
    if (this.user == null || !event.isUserInput) {
      return;
    }
    const roles = new Map(this.user.roles);
    roles.set(workgroupId, Role.Viewer);
    this.store.dispatch(actions.updateUser({ user: { ...this.user, roles } }));
    this.resetWorkgroupSearch();
  }

  public updateWorkgroupRole(event: MatSelectChange, workgroupId: WorkgroupId) {
    if (!this.user) {
      return;
    }
    const roles = new Map(this.user.roles);
    roles.set(workgroupId, event.value as Role);
    this.updateUser({ ...this.user, roles });
  }

  public removeWorkgroupRole(workgroupId: WorkgroupId) {
    if (!this.user) {
      return;
    }
    const roles = new Map(this.user.roles);
    roles.delete(workgroupId);
    this.updateUser({ ...this.user, roles });
  }

  private updateUser(user: User) {
    this.store.dispatch(actions.updateUser({ user }));
  }

  private getUserFromRoute() {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params: ParamMap) => {
        const userId = params.get('id');
        if (userId) {
          this.store.dispatch(actions.findUser({ userId }));
        }
      })
    );
  }

  private initializeForm() {
    this.formGroup.patchValue(
      {
        isAdmin: this.user?.isAdmin ?? false,
        lang: this.user?.lang ?? 'de',
      },
      { emitEvent: false }
    );
  }

  private initSubscriptions() {
    this.subscriptions.add(
      this.user$.subscribe((user) => {
        this.user = user;
        this.initializeForm();
      })
    );
    this.subscriptions.add(
      this.workgroups$.subscribe((workgroups) => {
        if (workgroups) {
          this.workgroups = workgroups;
          this.filteredWorkgroups = workgroups;
        }
      })
    );

    this.subscriptions.add(
      this.workgroupAutoCompleteControl.valueChanges
        .pipe(
          map((it) => it ?? ''),
          startWith(''),
          map((value) =>
            this.workgroups.filter((workgroup) => workgroup.name.toLowerCase().includes(value.toLowerCase().trim()))
          )
        )
        .subscribe((workgroups) => {
          this.filteredWorkgroups = workgroups;
        })
    );

    this.subscriptions.add(
      this.formGroup.valueChanges.subscribe(() => {
        if (this.user == null || this.formGroup.pristine) {
          return;
        }
        this.updateUser({
          ...this.user,
          isAdmin: this.formGroup.controls.isAdmin.value ?? false,
          lang: this.formGroup.controls.lang.value ?? 'de',
        });
      })
    );

    this.subscriptions.add(
      this.isCurrentUser$.subscribe((isCurrentUser) => {
        if (isCurrentUser) {
          this.formGroup.controls.isAdmin.disable();
        } else {
          this.formGroup.controls.isAdmin.enable();
        }
      })
    );
  }
}
