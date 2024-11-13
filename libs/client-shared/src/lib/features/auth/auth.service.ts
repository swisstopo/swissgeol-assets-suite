import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ORD } from '@asset-sg/core';
import { User, UserSchema } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { OAuthService } from 'angular-oauth2-oidc';
import { plainToInstance } from 'class-transformer';
import { BehaviorSubject, map, Observable, startWith } from 'rxjs';
import { DisclaimerDialogComponent } from '../../components/disclaimer-dialog/disclaimer-dialog.component';
import { ConfigService } from '../../services';
import { appSharedStateActions, AppState } from '../../state';
import { ApiError } from '../../utils';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly oauthService = inject(OAuthService);
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly dialogService = inject(MatDialog);
  private readonly configService = inject(ConfigService);

  private readonly _state$ = new BehaviorSubject(AuthState.Ongoing);
  private readonly _isInitialized$ = new BehaviorSubject(false);

  async initialize(oAuthConfig: Record<string, unknown>) {
    if (oAuthConfig['anonymous_mode']) {
      this.setState(AuthState.Success);
      this.store.dispatch(appSharedStateActions.setAnonymousMode());
    } else {
      const callbackUrl = sessionStorage.getItem(CALLBACK_PATH_KEY);
      sessionStorage.setItem(CALLBACK_PATH_KEY, window.location.pathname + window.location.search);
      this.configureOAuth(
        oAuthConfig['oauth_issuer'] as string,
        oAuthConfig['oauth_clientId'] as string,
        oAuthConfig['oauth_scope'] as string,
        oAuthConfig['oauth_showDebugInformation'] as boolean,
        oAuthConfig['oauth_tokenEndpoint'] as string
      );
      await this.signIn();
      if (callbackUrl != null) {
        await this.router.navigateByUrl(callbackUrl);
      }
      if (this.oauthService.hasValidAccessToken()) {
        sessionStorage.removeItem(CALLBACK_PATH_KEY);
      }
      this.store.dispatch(appSharedStateActions.loadUserProfile());
    }
    this._isInitialized$.next(true);
  }

  async signIn(): Promise<void> {
    try {
      if (this._state$.value === AuthState.Ongoing) {
        const success = await this.oauthService.loadDiscoveryDocumentAndLogin();
        if (success) {
          this.oauthService.setupAutomaticSilentRefresh();

          // If something else has interrupted the auth process, then we don't want to signal a success.
          if (this._state$.value === AuthState.Ongoing) {
            this._state$.next(AuthState.Success);

            if (!this.configService.getHideDisclaimer()) {
              this.dialogService.open(DisclaimerDialogComponent, {
                width: '500px',
                disableClose: true,
              });
            }
          }
        }
      } else {
        this._state$.next(AuthState.Ongoing);
        this.oauthService.initLoginFlow();
      }
    } catch (e) {
      this._state$.next(AuthState.Aborted);
    }
  }

  get state(): AuthState {
    return this._state$.value;
  }

  get state$(): Observable<AuthState> {
    return this._state$.asObservable();
  }

  get isInitialized$(): Observable<boolean> {
    return this._isInitialized$.asObservable();
  }

  setState(state: AuthState): void {
    this._state$.next(state);
  }

  getUserProfile(): ORD.ObservableRemoteData<ApiError, User> {
    return this.getUserProfile$().pipe(
      map((it) => RD.success(it)),
      startWith(RD.pending)
    );
  }

  isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  logOut(): void {
    this.oauthService.logOut({
      client_id: this.oauthService.clientId,
      redirect_uri: window.location.origin,
      response_type: this.oauthService.responseType,
    });
  }

  public getUserProfile$(): Observable<User> {
    return this.httpClient.get('/api/users/current').pipe(map((it) => plainToInstance(UserSchema, it)));
  }

  private configureOAuth(
    issuer: string,
    clientId: string,
    scope: string,
    showDebugInformation: boolean,
    tokenEndpoint: string
  ): void {
    this.oauthService.configure({
      issuer,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      clientId,
      scope,
      responseType: 'code',
      showDebugInformation,
      strictDiscoveryDocumentValidation: false,
      tokenEndpoint,
    });
  }
}

const CALLBACK_PATH_KEY = 'session.callback_path';

export enum AuthState {
  Ongoing,
  Aborted,
  AccessForbidden,
  ForbiddenResource,
  Success,
}
