import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import { OAuthService } from 'angular-oauth2-oidc';
import * as D from 'io-ts/Decoder';
import { map, startWith } from 'rxjs';
import urlJoin from 'url-join';

import { ApiError, httpErrorResponseOrUnknownError } from '@asset-sg/client-shared';
import { OE, ORD, decode, decodeError } from '@asset-sg/core';
import { User } from '@asset-sg/shared';




@Injectable({ providedIn: 'root' })
export class AuthService {
    private _httpClient = inject(HttpClient);

    private _oauthService = inject(OAuthService);

    public async configureOAuth(
        issuer: string,
        clientId: string,
        scope: string,
        showDebugInformation: boolean,
        tokenEndpoint: string,
    ) {
        this._oauthService.configure({
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
        await this._oauthService.loadDiscoveryDocumentAndLogin();
        this._oauthService.setupAutomaticSilentRefresh();
    }

    getUserProfile(): ORD.ObservableRemoteData<ApiError, User> {
        return this._getUserProfile().pipe(map(RD.fromEither), startWith(RD.pending));
    }

    isLoggedIn(): boolean {
        return this._oauthService.hasValidAccessToken();
    }


    logOut(): void {
        this._oauthService.logOut({
            client_id: this._oauthService.clientId,
            redirect_uri: window.location.origin,
            response_type: this._oauthService.responseType,
        });
    }

    private _getUserProfile() {
        return this._httpClient
            .get('/api/user')
            .pipe(map(decode(User)), OE.catchErrorW(httpErrorResponseOrUnknownError));
    }


    buildAuthUrl = (path: string) => urlJoin(`/auth`, path);
}
