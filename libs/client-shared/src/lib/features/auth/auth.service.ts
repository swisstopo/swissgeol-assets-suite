import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AppConfig, AppMode, OAuthConfig, User, UserSchema } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { OAuthService } from 'angular-oauth2-oidc';
import { plainToInstance } from 'class-transformer';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { DisclaimerDialogComponent } from '../../components/disclaimer-dialog/disclaimer-dialog.component';
import { ConfigService } from '../../services';
import { SessionStorageService } from '../../services/session-storage.service';
import { appSharedStateActions, AppState } from '../../state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly configService = inject(ConfigService);
  private readonly oauthService = inject(OAuthService);
  private readonly sessionStorageService = inject(SessionStorageService);

  private readonly httpClient = inject(HttpClient);
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly dialogService = inject(MatDialog);

  private readonly subjectForState = new BehaviorSubject(AuthState.Ongoing);
  private readonly subjectForIsInitialized = new BehaviorSubject(false);

  async initialize(config: AppConfig): Promise<void> {
    if (isAnonymous(config)) {
      this.initializeAnonymousMode();
    } else {
      await this.initializeSession(config);
    }
    this.subjectForIsInitialized.next(true);
    this.finalize(config);
  }

  private initializeAnonymousMode(): void {
    this.setState(AuthState.Success);
    this.store.dispatch(appSharedStateActions.setAnonymousMode({ isAnonymous: true }));
  }

  private async initializeSession(config: AppConfig): Promise<void> {
    const callbackUrl = this.sessionStorageService.get('session.callback_path');
    this.sessionStorageService.set('session.callback_path', window.location.pathname + window.location.search);
    this.configureOAuth(config.oauth);
    this.store.dispatch(appSharedStateActions.setAnonymousMode({ isAnonymous: false }));
    await this.signIn();
    this.store.dispatch(appSharedStateActions.loadUser());
    if (callbackUrl != null) {
      await this.router.navigateByUrl(callbackUrl, { replaceUrl: true });
    }
    if (this.oauthService.hasValidAccessToken()) {
      this.sessionStorageService.unset('session.callback_path');
    }
  }

  private finalize(config: AppConfig): void {
    const isLoggedIn = isAnonymous(config) || this.subjectForState.value === AuthState.Success;
    if (isLoggedIn && !this.configService.getHideDisclaimer()) {
      this.dialogService.open(DisclaimerDialogComponent, {
        width: '960px',
        disableClose: true,
        autoFocus: false,
      });
    }
  }

  async signIn(): Promise<void> {
    try {
      if (this.subjectForState.value === AuthState.Ongoing) {
        const success = await this.oauthService.loadDiscoveryDocumentAndLogin();
        if (success) {
          this.oauthService.setupAutomaticSilentRefresh();

          // If something else has interrupted the auth process, then we don't want to signal a success.
          if (this.subjectForState.value === AuthState.Ongoing) {
            this.subjectForState.next(AuthState.Success);
          }
        }
      } else {
        this.subjectForState.next(AuthState.Ongoing);
        this.oauthService.initLoginFlow();
      }
    } catch {
      this.subjectForState.next(AuthState.Aborted);
    }
  }

  get state(): AuthState {
    return this.subjectForState.value;
  }

  get state$(): Observable<AuthState> {
    return this.subjectForState.asObservable();
  }

  get isInitialized$(): Observable<boolean> {
    return this.subjectForIsInitialized.asObservable();
  }

  setState(state: AuthState): void {
    this.subjectForState.next(state);
  }

  fetchUser(): Observable<User> {
    return this.httpClient.get('/api/users/current').pipe(map((it) => plainToInstance(UserSchema, it)));
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

  private configureOAuth(config: OAuthConfig): void {
    this.oauthService.configure({
      ...config,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      responseType: 'code',
      strictDiscoveryDocumentValidation: false,
    });
  }
}

export enum AuthState {
  Ongoing,
  Aborted,
  AccessForbidden,
  ForbiddenResource,
  Success,
}

const isAnonymous = (config: AppConfig): boolean => {
  return config.mode === AppMode.Anonymous;
};
