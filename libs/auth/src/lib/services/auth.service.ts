import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import { TranslateService } from '@ngx-translate/core';
import { OAuthService } from 'angular-oauth2-oidc';
import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { catchError, map, of, startWith, tap } from 'rxjs';
import urlJoin from 'url-join';

import { ApiError, httpErrorResponseOrUnknownError } from '@asset-sg/client-shared';
import { OE, ORD, decode, decodeError } from '@asset-sg/core';
import { User } from '@asset-sg/shared';
import { oAuthConfig } from '../../../../../configs/oauth.config';

const TokenEndpointResponse = D.struct({
    access_token: D.string,
    refresh_token: D.string,
});
interface TokenEndpointResponse extends D.TypeOf<typeof TokenEndpointResponse> {}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _httpClient = inject(HttpClient);
    private _dcmnt = inject(DOCUMENT);
    private _translateService = inject(TranslateService);
    private _oauthService = inject(OAuthService);

    private _getUserProfile() {
        return this._httpClient
            .get('/api/user')
            .pipe(map(decode(User)), OE.catchErrorW(httpErrorResponseOrUnknownError));
    }

    init(): void {
        this._oauthService.configure({
            issuer: oAuthConfig.issuer,
            redirectUri:  window.location.origin,
            postLogoutRedirectUri:  window.location.origin,
            clientId: oAuthConfig.clientId,
            scope: oAuthConfig.scope,
            responseType: oAuthConfig.responseType,
            showDebugInformation: oAuthConfig.showDebugInformation,
          strictDiscoveryDocumentValidation: false,
          dummyClientSecret: oAuthConfig.clientSecret,
          });
          this._oauthService.loadDiscoveryDocumentAndLogin();
          this._oauthService.setupAutomaticSilentRefresh();
    }

    getUserProfile(): ORD.ObservableRemoteData<ApiError, User> {
        return this._getUserProfile().pipe(map(RD.fromEither), startWith(RD.pending));
    }

    login(email: string, password: string): ORD.ObservableRemoteData<ApiError, User> {
        return this._httpClient.post(this.buildAuthUrl('token?grant_type=password'), { email, password }).pipe(
            map(E.right),
            catchError(e => of(E.left(httpErrorResponseOrUnknownError(e)))),
            OE.chainEitherW(flow(TokenEndpointResponse.decode, E.mapLeft(decodeError))),
            tap(a => {
                if (E.isRight(a)) {
                    localStorage.setItem('accessToken', a.right.access_token);
                    localStorage.setItem('refreshToken', a.right.refresh_token);
                } else {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
            }),
            OE.chainSwitchMapW(() => this._getUserProfile()),
            map(RD.fromEither),
            startWith(RD.pending),
        );
    }

    logOut(): void {
        this._oauthService.logOut();
    }

    logout(): ORD.ObservableRemoteData<ApiError, void> {
        this._oauthService.logOut();
        const accessToken = localStorage.getItem('accessToken');
        return this._httpClient
            .post(
                this.buildAuthUrl('/logout'),
                {},
                {
                    headers: {
                        Authorization: 'Bearer ' + accessToken,
                    },
                },
            )
            .pipe(
                map(() => E.right(undefined)),
                OE.catchErrorW(httpErrorResponseOrUnknownError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    recoverPassword(email: string): ORD.ObservableRemoteData<ApiError, void> {
        return this._httpClient
            .post(
                this.buildAuthUrl('recover'),
                { email },
                {
                    headers: {
                        redirect_to: urlJoin(
                            this._dcmnt.location.origin,
                            this._translateService.currentLang || 'de',
                            '/a/reset-password',
                        ),
                    },
                },
            )
            .pipe(
                map(() => E.right(undefined)),
                OE.catchErrorW(httpErrorResponseOrUnknownError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    // refreshAccessToken() {
    //     return this.httpClient.post('http://localhost:4200/auth/token?grant_type=refresh_token', {});
    // }

    // verifyRecoveryToken(email: string, token: string): ORD.ObservableRemoteData<ApiResponseError, void> {
    //     return this.httpClient.post(buildAuthUrl('verify'), { type: 'recovery', token, email }).pipe(
    //         // return this.httpClient
    //         //     .get(buildAuthUrl('verify?') + queryString.stringify({ type: 'recovery', token, email }))
    //         // .pipe(
    //         map(() => E.right(undefined)),
    //         catchError((err: HttpErrorResponse) =>
    //             of(E.left(apiErrorResponseError({ status: err.status, statusText: err.statusText, error: err.error }))),
    //         ),
    //         map(RD.fromEither),
    //         startWith(RD.pending),
    //     );
    // }

    changePassword(accessToken: string, password: string): ORD.ObservableRemoteData<ApiError, void> {
        return this._httpClient
            .put(this.buildAuthUrl('user'), { password }, { headers: { Authorization: 'Bearer ' + accessToken } })
            .pipe(
                map(() => E.right(undefined)),
                OE.catchErrorW(httpErrorResponseOrUnknownError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    buildAuthUrl = (path: string) => urlJoin(`/auth`, path);
}
