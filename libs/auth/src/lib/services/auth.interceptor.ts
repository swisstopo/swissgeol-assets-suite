import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { oAuthConfig } from 'configs/oauth.config';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private _oauthService = inject(OAuthService);

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = sessionStorage.getItem('access_token');

        if (req.url.includes(oAuthConfig.issuer) || req.url.includes('token')) {
            return next.handle(req);
        } else if (token && !this._oauthService.hasValidAccessToken()) {
            this._oauthService.logOut({
                client_id: oAuthConfig.clientId,
                redirect_uri: window.location.origin,
                response_type: oAuthConfig.responseType,
            });
            return throwError(new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
        } else if (!token) {
            return throwError(new HttpErrorResponse({ status: 401, statusText: 'No Token' }));
        } else {
            return next.handle(req);
        }
    }
}
