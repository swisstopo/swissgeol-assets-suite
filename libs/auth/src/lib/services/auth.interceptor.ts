import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { catchError, EMPTY, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private _oauthService = inject(OAuthService);
    private _router: Router = inject(Router);

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = sessionStorage.getItem('access_token');

        if (
            (this._oauthService.issuer && req.url.includes(this._oauthService.issuer)) ||
            (this._oauthService.tokenEndpoint && req.url.includes(this._oauthService.tokenEndpoint)) ||
            req.url.includes('oauth-config/config')
        ) {
            return next.handle(req);
        } else if (token && !this._oauthService.hasValidAccessToken()) {
            this._oauthService.logOut({
                client_id: this._oauthService.clientId,
                redirect_uri: window.location.origin,
                response_type: this._oauthService.responseType,
            });
            return EMPTY;
        }  else if (!token) {
          return EMPTY;
        } else {
            return next.handle(req).pipe(
              catchError((error: HttpErrorResponse) => {
                this._router.navigate(['de/error'], { state: { errorMessage: error.error.error } });
                return EMPTY;
              })
            );
        }
    }
}
