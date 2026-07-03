import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { appSharedStateActions, AuthService, fromAppShared, LanguageService } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, filter, map, switchMap, take } from 'rxjs';
import { AppSharedStateService } from './app-shared-state.service';
import { AppState } from './app-state';

@UntilDestroy()
@Injectable()
export class AppSharedStateEffects {
  actions$ = inject(Actions);
  store = inject(Store<AppState>);
  appSharedStateService = inject(AppSharedStateService);
  authService = inject(AuthService);
  router = inject(Router);
  languageService = inject(LanguageService);

  constructor() {
    combineLatest([
      this.store.select(fromAppShared.selectUser).pipe(filter(isNotNull)),
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
    ])
      .pipe(take(1), untilDestroyed(this))
      .subscribe(([user]) => {
        if (this.languageService.language === user.lang) {
          return;
        }
        const urlTree = this.router.parseUrl(this.router.url);
        const segments = urlTree.root.children['primary']?.segments;
        if (segments && segments.length > 0) {
          segments[0].path = user.lang;
        }
        this.router.navigateByUrl(urlTree, { replaceUrl: true }).then();
      });

    this.actions$.pipe(ofType(appSharedStateActions.logout), untilDestroyed(this)).subscribe(() => {
      this.store.dispatch(appSharedStateActions.loadUser());
      this.store.dispatch(appSharedStateActions.loadReferenceData());
    });
  }

  loadValueLists$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appSharedStateActions.loadReferenceData),
      switchMap(() => this.appSharedStateService.fetchReferenceData()),
      map((referenceData) => appSharedStateActions.setReferenceData({ referenceData })),
    ),
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appSharedStateActions.loadUser, appSharedStateActions.updateUserOnAdminEdit),
      switchMap(() => this.authService.fetchUser()),
      map(appSharedStateActions.setUser),
    ),
  );

  loadWorkgroups$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appSharedStateActions.loadWorkgroups, appSharedStateActions.updateUserOnAdminEdit),
      switchMap(() => this.appSharedStateService.loadWorkgroups()),
      map((workgroups) => appSharedStateActions.setWorkgroups({ workgroups })),
    ),
  );
}
