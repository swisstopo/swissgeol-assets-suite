import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@asset-sg/auth';
import { appSharedStateActions, fromAppShared } from '@asset-sg/client-shared';
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
        const url = this.router.url;
        const match = /^\/(\w\w)/.exec(url);
        if (!match || (match && match[1] && match[1] !== user.lang)) {
          const newUrl = `/${user.lang}${url.slice(3)}`;
          this.router.navigateByUrl(newUrl);
        }
      });

    this.actions$.pipe(ofType(appSharedStateActions.logout), untilDestroyed(this)).subscribe(() => {
      this.store.dispatch(appSharedStateActions.loadUserProfile());
      this.store.dispatch(appSharedStateActions.loadReferenceData());
    });

    this.actions$
      .pipe(
        ofType<RouterNavigationAction<RouterStateSnapshot>>(ROUTER_NAVIGATION),
        map((a) => a.payload.routerState.url.match(/^\/(\w\w)/)),
        map((match) => match && match[1]),
        filter(Boolean),
        map(Lang.decode),
        distinctUntilChanged(eqLangRight.equals),
        untilDestroyed(this)
      )
      .subscribe((lang) => {
        if (E.isRight(lang)) {
          if (this.translateService.currentLang !== lang.right) {
            this.translateService.use(lang.right);
            this.store.dispatch(appSharedStateActions.setLang({ lang: lang.right as Lang }));
          }
        } else {
          console.error('Invalid lang in URL:', lang.left);
          this.router.navigate(['/']);
        }
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
}
