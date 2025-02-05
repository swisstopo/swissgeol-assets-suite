import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router, RouterStateSnapshot } from '@angular/router';
import { appSharedStateActions, AuthService, fromAppShared } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';
import { eqLangRight, Lang } from '@asset-sg/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as E from 'fp-ts/Either';
import { combineLatest, distinctUntilChanged, filter, map, switchMap, take } from 'rxjs';

import { AppSharedStateService } from './app-shared-state.service';
import { AppState } from './app-state';

@UntilDestroy()
@Injectable()
export class AppSharedStateEffects {
  actions$ = inject(Actions);
  translateService = inject(TranslateService);
  store = inject(Store<AppState>);
  appSharedStateService = inject(AppSharedStateService);
  authService = inject(AuthService);
  router = inject(Router);

  constructor() {
    combineLatest([
      this.store.select(fromAppShared.selectRDUserProfile).pipe(ORD.fromFilteredSuccess),
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
    ])
      .pipe(take(1), untilDestroyed(this))
      .subscribe(([user]) => {
        // Change the URL to the current user's language.
        const url = this.router.url;
        const newUrl = `/${user.lang}${url.slice(3)}`;
        this.router.navigateByUrl(newUrl).then();
      });

    this.actions$.pipe(ofType(appSharedStateActions.logout), untilDestroyed(this)).subscribe(() => {
      this.store.dispatch(appSharedStateActions.loadUserProfile());
      this.store.dispatch(appSharedStateActions.loadReferenceData());
    });

    this.actions$
      .pipe(
        ofType<RouterNavigationAction<RouterStateSnapshot>>(ROUTER_NAVIGATION),
        map((a) => a.payload.routerState.url.match(/^\/(\w\w)/)?.[1]),
        filter(Boolean),
        map(Lang.decode),
        distinctUntilChanged(eqLangRight.equals),
        untilDestroyed(this)
      )
      .subscribe((result) => {
        if (E.isLeft(result)) {
          console.error('Invalid lang in URL:', result.left);
          return;
        }
        const { right: lang } = result;
        if (this.translateService.currentLang === lang) {
          return;
        }
        this.translateService.use(lang);
        this.store.dispatch(appSharedStateActions.setLang({ lang: lang as Lang }));
      });
  }

  loadValueLists$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appSharedStateActions.loadReferenceData),
      switchMap(() => this.appSharedStateService.loadReferenceData()),
      map(appSharedStateActions.loadReferenceDataResult)
    )
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appSharedStateActions.loadUserProfile),
      switchMap(() => this.authService.getUserProfile()),
      map(appSharedStateActions.loadUserProfileResult)
    )
  );

  loadWorkgroups$ = createEffect(() =>
    this.actions$.pipe(
      ofType(appSharedStateActions.loadWorkgroups),
      switchMap(() => this.appSharedStateService.loadWorkgroups()),
      map((workgroups) => appSharedStateActions.loadWorkgroupsResult({ workgroups }))
    )
  );
}
