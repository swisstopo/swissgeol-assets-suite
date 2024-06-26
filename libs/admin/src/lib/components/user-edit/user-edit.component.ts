import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatOptionSelectionChange } from '@angular/material/core';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { Role } from '@prisma/client';
import { map, startWith, Subscription } from 'rxjs';
import { User, Workgroup, WorkgroupOnUser } from '../../services/admin.service';
import * as actions from '../../state/admin.actions';
import { AppStateWithAdmin } from '../../state/admin.reducer';
import { selectSelectedUser, selectWorkgroups } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
})
export class UserEditComponent implements OnInit, OnDestroy {
  public roles: Role[] = Object.values(Role);
  public user?: User;
  public workgroups: Workgroup[] = [];
  public filteredWorkgroups: Workgroup[] = [];
  public workgroupAutoCompleteControl = new FormControl('');
  public formGroup = new FormGroup({
    isAdmin: new FormControl(false),
    lang: new FormControl('de'),
  });

  protected readonly COLUMNS = ['name', 'role', 'actions'];

  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store<AppStateWithAdmin>);
  private readonly workgroups$ = this.store.select(selectWorkgroups);
  private readonly user$ = this.store.select(selectSelectedUser);
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.getUserFromRoute();
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public resetWorkgroupSearch() {
    this.workgroupAutoCompleteControl.setValue('');
  }

  public isUserPartOfWorkgroup(workgroupId: number): boolean {
    return !!this.user?.workgroups.find((workgroup) => workgroup.workgroupId === workgroupId);
  }

  public addWorkgroupToUser(event: MatOptionSelectionChange, workgroupId: number) {
    if (!this.user || !event.isUserInput) {
      return;
    }
    const selectedWorkgroup = this.workgroups.find((workgroup) => workgroup.id === workgroupId);

    const workgroupToAdd: WorkgroupOnUser = {
      workgroupId: workgroupId,
      workgroup: { name: selectedWorkgroup!.name },
      role: Role.Viewer,
    };
    const updatedWorkgroups = [...this.user.workgroups, workgroupToAdd];
    this.store.dispatch(actions.updateUser({ user: { ...this.user, workgroups: updatedWorkgroups } }));
    this.resetWorkgroupSearch();
  }

  public updateRoleForWorkgroup(event: MatSelectChange, workgroup: WorkgroupOnUser) {
    if (!this.user) {
      return;
    }
    const updatedWorkgroups = this.user.workgroups.map((userWorkgroup) => {
      if (userWorkgroup.workgroupId === workgroup.workgroupId) {
        return {
          ...userWorkgroup,
          role: event.value,
        };
      }
      return userWorkgroup;
    });
    this.updateUser({ ...this.user, workgroups: updatedWorkgroups });
  }

  public deleteWorkgroupFromUser(workgroup: WorkgroupOnUser) {
    if (!this.user) {
      return;
    }
    const updatedWorkgroups = this.user.workgroups.filter(
      (userWorkgroup) => userWorkgroup.workgroupId !== workgroup.workgroupId
    );
    this.updateUser({ ...this.user, workgroups: updatedWorkgroups });
  }

  private updateUser(user: User) {
    this.store.dispatch(actions.updateUser({ user }));
  }

  private getUserFromRoute() {
    this.subscriptions.add(
      this.route.paramMap
        .pipe(
          map((params: ParamMap) => {
            const userId = params.get('id');
            if (userId) {
              return this.store.dispatch(actions.findUser({ userId }));
            }
          })
        )
        .subscribe()
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
          startWith(''),
          map((value) =>
            this.workgroups.filter((workgroup) => workgroup.name.toLowerCase().includes(value!.toLowerCase().trim()))
          )
        )
        .subscribe((workgroups) => {
          this.filteredWorkgroups = workgroups;
        })
    );

    this.subscriptions.add(
      this.formGroup.valueChanges.subscribe((value) => {
        const updatedUser: User = {
          ...this.user!,
          isAdmin: value.isAdmin ?? false,
          lang: value.lang ?? 'de',
        };
        this.updateUser(updatedUser);
      })
    );
  }
}
