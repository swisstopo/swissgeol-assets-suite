import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import { TranslateService } from '@ngx-translate/core';
import { OAuthService } from 'angular-oauth2-oidc';
import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { catchError, map, of, startWith, tap } from 'rxjs';
import urlJoin from 'url-join';

import { ApiError, httpErrorResponseOrUnknownError } from '@asset-sg/client-shared';
import { decode, decodeError, OE, ORD } from '@asset-sg/core';
import { User } from '@asset-sg/shared';

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
