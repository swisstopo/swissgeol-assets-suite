import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  appSharedStateActions,
  AuthService,
  fromAppShared,
  LanguageService,
  replaceLanguageInUrl,
} from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
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
    // Once the user profile is loaded, switch to the user's preferred language (if different)
    // The URL is updated to reflect the new language via replaceUrl so the back button isn't affected.
    this.store
      .select(fromAppShared.selectUser)
      .pipe(filter(isNotNull), take(1), untilDestroyed(this))
      .subscribe((user) => {
        const currentLang = this.languageService.language;
        if (currentLang === user.lang) {
          return;
        }
        const newUrl = replaceLanguageInUrl(this.router.url, currentLang, user.lang);
        this.router.navigateByUrl(newUrl, { replaceUrl: true });
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
