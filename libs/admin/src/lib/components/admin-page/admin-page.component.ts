import { Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppPortalService, AppState, LanguageService, LifecycleHooksDirective } from '@asset-sg/client-shared';
import { User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import * as actions from '../../state/admin.actions';
import { deleteWorkgroup } from '../../state/admin.actions';
import { selectIsLoading, selectSelectedUser, selectSelectedWorkgroup } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-admin',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  hostDirectives: [LifecycleHooksDirective],
  standalone: false,
})
export class AdminPageComponent implements OnInit, OnDestroy {
  @ViewChild('templateDrawerPortalContent') templateDrawerPortalContent!: TemplateRef<unknown>;

  public workgroup: Workgroup | null = null;
  public user: User | null = null;

  private readonly appPortalService = inject(AppPortalService);
  private readonly languageService = inject(LanguageService);

  private readonly store = inject(Store<AppState>);
  public readonly isLoading$ = this.store.select(selectIsLoading);
  public readonly selectedUser$ = this.store.select(selectSelectedUser);
  public readonly selectedWorkgroup$ = this.store.select(selectSelectedWorkgroup);

  private readonly router = inject(Router);
  private readonly subscriptions = new Subscription();

  public ngOnInit(): void {
    this.store.dispatch(actions.listWorkgroups());
    this.store.dispatch(actions.listUsers());
    this.appPortalService.setAppBarPortalContent(null);
    this.appPortalService.setDrawerPortalContent(null);
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public get isDetailPage(): boolean {
    return this.isWorkgroupDetailPage || this.isUsersPage || this.router.url.includes('/new');
  }

  public get isUsersPage(): boolean {
    return this.router.url.includes('/users/');
  }

  public get isWorkgroupDetailPage(): boolean {
    return this.router.url.includes('/workgroups/');
  }

  public get isWorkgroupPage(): boolean {
    return this.router.url.endsWith('/workgroups');
  }

  public toggleActiveStatus(workgroup: Workgroup): void {
    const disabledAt = workgroup.disabledAt ? null : new Date();
    this.store.dispatch(
      actions.updateWorkgroup({
        workgroupId: workgroup.id,
        workgroup: { disabledAt, name: workgroup.name, users: workgroup.users },
      }),
    );
  }

  getBackPath(): string[] {
    if (this.router.url.includes('/workgroups/')) {
      return [`/${this.languageService.language}/admin/workgroups`];
    }
    return [`/${this.languageService.language}/admin/users`];
  }

  navigateBack(): void {
    if (this.isDetailPage) {
      this.router.navigate(this.getBackPath()).then();
      return;
    }
    this.router.navigate([this.languageService.language, 'asset-admin']).then();
  }

  public deleteWorkgroup(workgroupId: WorkgroupId): void {
    this.store.dispatch(deleteWorkgroup({ workgroupId }));
  }

  private initSubscriptions(): void {
    this.subscriptions.add(
      this.selectedWorkgroup$.subscribe((workgroup) => {
        this.workgroup = workgroup;
      }),
    );

    this.subscriptions.add(
      this.selectedUser$.subscribe((user) => {
        this.user = user;
      }),
    );
  }
}
