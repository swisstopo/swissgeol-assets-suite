import { Location } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppState, LifecycleHooksDirective } from '@asset-sg/client-shared';
import { Store } from '@ngrx/store';
import * as actions from '../../state/admin.actions';
import { selectIsLoading } from '../../state/admin.selector';

@Component({
  selector: 'asset-sg-admin',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  hostDirectives: [LifecycleHooksDirective],
})
export class AdminPageComponent {
  @ViewChild('templateDrawerPortalContent') templateDrawerPortalContent!: TemplateRef<unknown>;

  private readonly store = inject(Store<AppState>);
  // private readonly location = inject(Location);

  public readonly isLoading$ = this.store.select(selectIsLoading);

  constructor(private location: Location, private router: Router) {
    this.store.dispatch(actions.listWorkgroups());
    this.store.dispatch(actions.listUsers());
  }

  public get isDetailPage(): boolean {
    // Example condition, adjust based on your routing structure
    return (
      this.router.url.includes('/workgroups/') ||
      this.router.url.includes('/users/') ||
      this.router.url.includes('/new')
    );
  }

  goBack(): void {
    this.location.back();
  }
}
