import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private _oauthService = inject(OAuthService);

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = sessionStorage.getItem('access_token');

        if (
            req.url.includes('https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_dbfEb2FuH') ||
            req.url.includes('https://ngm-dev.auth.eu-west-1.amazoncognito.com/oauth2/token')
        ) {
            return next.handle(req);
        } else if (token && !this._oauthService.hasValidAccessToken()) {
            this._oauthService.logOut({
                client_id: '2tq8nn0vu3hoor3trgpq6k87b7',
                redirect_uri: window.location.origin,
                response_type: 'code',
            });
            return throwError(new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
        } else if (!token) {
            return throwError(new HttpErrorResponse({ status: 401, statusText: 'No Token' }));
        } else {
            return next.handle(req);
        }
    }
}
