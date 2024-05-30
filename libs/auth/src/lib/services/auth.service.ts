import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable, map, startWith } from 'rxjs';
import urlJoin from 'url-join';

import { ApiError, httpErrorResponseOrUnknownError } from '@asset-sg/client-shared';
import { OE, ORD, decode } from '@asset-sg/core';
import { User } from '@asset-sg/shared';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _httpClient = inject(HttpClient);

    private oauthService = inject(OAuthService);

    private state = new BehaviorSubject(AuthState.Ongoing);

    public configureOAuth(
        issuer: string,
        clientId: string,
        scope: string,
        showDebugInformation: boolean,
        tokenEndpoint: string,
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
            if (this.state.value === AuthState.Ongoing) {
                await this.oauthService.loadDiscoveryDocumentAndLogin();
                this.oauthService.setupAutomaticSilentRefresh();
                this.state.next(AuthState.Success);
            } else {
                this.state.next(AuthState.Ongoing);
                this.oauthService.initLoginFlow();
            }
        } catch (e) {
            this.state.next(AuthState.Aborted);
        }
    }

    get state$(): Observable<AuthState> {
        return this.state.asObservable();
    }

    setState(state: AuthState): void {
        this.state.next(state);
    }

    getUserProfile(): ORD.ObservableRemoteData<ApiError, User> {
        return this._getUserProfile().pipe(map(RD.fromEither), startWith(RD.pending));
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

    private _getUserProfile() {
        return this._httpClient
            .get('/api/user')
            .pipe(map(decode(User)), OE.catchErrorW(httpErrorResponseOrUnknownError));
    }

    buildAuthUrl = (path: string) => urlJoin(`/auth`, path);
}

export enum AuthState {
    Ongoing,
    Aborted,
    Forbidden,
    Success,
}
