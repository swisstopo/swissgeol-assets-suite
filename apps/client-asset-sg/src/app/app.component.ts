import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { WINDOW } from 'ngx-window-token';
import { debounceTime, fromEvent, map, startWith } from 'rxjs';
import { assert } from 'tsafe';

import { AuthService } from '@asset-sg/auth';
import { ErrorService } from '@asset-sg/auth';
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
  private store = inject(Store<AppState>);

  readonly router: Router = inject(Router);
  readonly errorService = inject(ErrorService);
  readonly authService = inject(AuthService);

  constructor(private readonly _authService: AuthService) {
    this._httpClient
      .get('api/oauth-config/config')
      .pipe(
        map((response: any) => {
          return response;
        }),
      )
      .subscribe(async oAuthConfig => {
        await this._authService.configureOAuth(
          oAuthConfig.oauth_issuer,
          oAuthConfig.oauth_clientId,
          oAuthConfig.oauth_scope,
          oAuthConfig.oauth_showDebugInformation,
          oAuthConfig.oauth_tokenEndpoint,
        );

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
}
