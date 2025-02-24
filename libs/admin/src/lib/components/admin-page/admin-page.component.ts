import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppPortalService, AppState, CURRENT_LANG, LifecycleHooksDirective } from '@asset-sg/client-shared';
import { Store } from '@ngrx/store';
import * as actions from '../../state/admin.actions';
import { selectIsLoading, selectSelectedUser, selectSelectedWorkgroup } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-admin',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  hostDirectives: [LifecycleHooksDirective],
  standalone: false,
})
export class AdminPageComponent implements OnInit {
  @ViewChild('templateDrawerPortalContent') templateDrawerPortalContent!: TemplateRef<unknown>;

  private readonly store = inject(Store<AppState>);
  public readonly isLoading$ = this.store.select(selectIsLoading);
  public readonly selectedUser$ = this.store.select(selectSelectedUser);
  public readonly selectedWorkgroup$ = this.store.select(selectSelectedWorkgroup);
  public readonly currentLang$ = inject(CURRENT_LANG);
  private readonly appPortalService = inject(AppPortalService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.dispatch(actions.listWorkgroups());
    this.store.dispatch(actions.listUsers());
    this.appPortalService.setAppBarPortalContent(null);
    this.appPortalService.setDrawerPortalContent(null);
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

  getBackPath(lang: string): string[] {
    if (this.router.url.includes('/workgroups/')) {
      return [`/${lang}/admin/workgroups`];
    }
    return [`/${lang}/admin/users`];
  }

  navigateBack(lang: string): void {
    if (this.isDetailPage) {
      this.router.navigate(this.getBackPath(lang));
      return;
    }
    this.router.navigate([lang, 'asset-admin']);
  }
}
