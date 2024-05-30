import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { OAuthService } from 'angular-oauth2-oidc';
import { EMPTY, Observable, catchError } from 'rxjs';

import { AlertType, showAlert } from '@asset-sg/client-shared';

import { AuthService, AuthState } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private _oauthService = inject(OAuthService);
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);

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
    } else if (!token) {
      return EMPTY;
    } else {
      return next.handle(req).pipe(
        catchError((error: HttpErrorResponse) => {
          switch (error.status) {
            case 403:
              this.authService.setState(AuthState.Forbidden);
              break;
            case 401:
              this.store.dispatch(
                showAlert({
                  alert: {
                    id: `auth-error-${error.status}`,
                    text: error.error.error,
                    type: AlertType.Error,
                    isPersistent: true,
                  },
                }),
              );
              break;
            default:
              this.store.dispatch(
                showAlert({
                  alert: {
                    id: `request-error-${error.status}-${error.url}`,
                    text: error.error.message,
                    type: AlertType.Error,
                    isPersistent: true,
                  },
                }),
              );
          }
          return EMPTY;
        }),
      );
    }
  }
}
