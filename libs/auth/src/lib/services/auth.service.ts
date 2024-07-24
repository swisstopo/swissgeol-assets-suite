import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';
import { User, UserSchema } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { OAuthService } from 'angular-oauth2-oidc';
import { plainToInstance } from 'class-transformer';
import { BehaviorSubject, map, Observable, startWith } from 'rxjs';
import urlJoin from 'url-join';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _httpClient = inject(HttpClient);

  private oauthService = inject(OAuthService);

  private _state = new BehaviorSubject(AuthState.Ongoing);

  public configureOAuth(
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

  async signIn(): Promise<void> {
    try {
      if (this._state.value === AuthState.Ongoing) {
        const success = await this.oauthService.loadDiscoveryDocumentAndLogin();
        if (success) {
          this.oauthService.setupAutomaticSilentRefresh();

          // If something else has interrupted the auth process, then we don't want to signal a success.
          if (this._state.value === AuthState.Ongoing) {
            this._state.next(AuthState.Success);
          }
        }
      } else {
        this._state.next(AuthState.Ongoing);
        this.oauthService.initLoginFlow();
      }
    } catch (e) {
      this._state.next(AuthState.Aborted);
    }
  }

  get state(): AuthState {
    return this._state.value;
  }

  get state$(): Observable<AuthState> {
    return this._state.asObservable();
  }

  setState(state: AuthState): void {
    this._state.next(state);
  }

  getUserProfile(): ORD.ObservableRemoteData<ApiError, User> {
    return this._getUserProfile().pipe(
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

  private _getUserProfile(): Observable<User> {
    return this._httpClient.get('/api/users/current').pipe(map((it) => plainToInstance(UserSchema, it)));
  }

  buildAuthUrl = (path: string) => urlJoin(`/auth`, path);
}

export enum AuthState {
  Ongoing,
  Aborted,
  AccessForbidden,
  ForbiddenResource,
  Success,
}
