import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppPortalService, AppState, CURRENT_LANG, LifecycleHooksDirective } from '@asset-sg/client-shared';
import { Store } from '@ngrx/store';
import * as actions from '../../state/admin.actions';
import { selectIsLoading } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-admin',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  hostDirectives: [LifecycleHooksDirective],
})
export class AdminPageComponent implements OnInit {
  @ViewChild('templateDrawerPortalContent') templateDrawerPortalContent!: TemplateRef<unknown>;

  private readonly store = inject(Store<AppState>);
  public readonly isLoading$ = this.store.select(selectIsLoading);
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
    return (
      this.router.url.includes('/workgroups/') ||
      this.router.url.includes('/users/') ||
      this.router.url.includes('/new')
    );
  }

  getBackPath(lang: string): string[] {
    if (this.router.url.includes('/workgroups/')) {
      return [`/${lang}/admin/workgroups`];
    }
    return [`/${lang}/admin/users`];
  }
}
