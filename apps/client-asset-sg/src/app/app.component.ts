import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { WINDOW } from 'ngx-window-token';
import { debounceTime, fromEvent, startWith } from 'rxjs';
import { assert } from 'tsafe';

import { AuthService, AuthState, ErrorService } from '@asset-sg/auth';
import { AppPortalService, appSharedStateActions, setCssCustomProperties } from '@asset-sg/client-shared';

import { AppState } from './state/app-state';

const fullHdWidth = 1920;

@UntilDestroy()
@Component({
  selector: 'asset-sg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private _wndw = inject(WINDOW);
  private _httpClient = inject(HttpClient);
  public appPortalService = inject(AppPortalService);

  readonly router: Router = inject(Router);
  readonly errorService = inject(ErrorService);
  readonly authService = inject(AuthService);
  private readonly store = inject(Store<AppState>);

  constructor() {
    this._httpClient
      .get<Record<string, unknown>>('api/oauth-config/config')
      .subscribe(async (oAuthConfig) => {
        this.authService.configureOAuth(
          oAuthConfig['oauth_issuer'] as string,
          oAuthConfig['oauth_clientId'] as string,
          oAuthConfig['oauth_scope'] as string,
          oAuthConfig['oauth_showDebugInformation'] as boolean,
          oAuthConfig['oauth_tokenEndpoint'] as string,
        );
        await this.authService.signIn();
        this.store.dispatch(appSharedStateActions.loadUserProfile());
        this.store.dispatch(appSharedStateActions.loadReferenceData());
      });

    const wndw = this._wndw;
    assert(wndw != null);

    fromEvent(wndw, 'resize')
      .pipe(debounceTime(50), startWith(null), untilDestroyed(this))
      .subscribe(() => {
        let fontSize;
        const width = window.innerWidth;
        if (width >= fullHdWidth) {
          fontSize = '1rem';
        } else if (width >= 0.8 * fullHdWidth) {
          fontSize = `${width / fullHdWidth}rem`;
        } else {
          fontSize = '0.8rem';
        }
        setCssCustomProperties(wndw.document.documentElement, ['font-size', fontSize]);
      });
  }

  protected readonly AuthState = AuthState;
}
