import { HttpErrorResponse, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { AlertType, fromAppShared, showAlert } from '@asset-sg/client-shared';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { catchError, EMPTY, from, Observable, Subscription, switchMap } from 'rxjs';
import { AuthService, AuthState } from '../features/auth/auth.service';

@Injectable()
export class HttpInterceptor implements HttpInterceptor, OnDestroy {
  private _oauthService = inject(OAuthService);
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly subscription = new Subscription();

  /**
   * Whether the router is currently in the middle of a navigation.
   * If this is `false`, then the site is fully loaded and the user is able to interact with it.
   * @private
   */
  private isNavigating = false;
  private isAnonymousMode = false;

  constructor() {
    this.initializeRouterSubscription();
    this.initializeStoreSubscription();
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = sessionStorage.getItem('access_token');

    if (
      (this._oauthService.issuer && req.url.includes(this._oauthService.issuer)) ||
      (this._oauthService.tokenEndpoint && req.url.includes(this._oauthService.tokenEndpoint)) ||
      req.url.includes('oauth-config/config') ||
      this.isAnonymousMode
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
      return next
        .handle(req)
        .pipe(catchError((error: HttpErrorResponse) => from(this.handleError(error)).pipe(switchMap(() => EMPTY))));
    }
  }

  private async handleError(error: HttpErrorResponse): Promise<void> {
    switch (error.status) {
      case 403:
        if (
          error.error == 'not authorized by eIAM' ||
          (typeof error.error === 'object' && error.error != null && error.error.error === 'not authorized by eIAM')
        ) {
          // The initial logging via eIAM was successful,
          // but the user does not have access to this application.
          this.authService.setState(AuthState.AccessForbidden);
        } else if (this.isNavigating) {
          // The user attempted to navigate to a page to which they have no access.
          // A common way this happens is by manually accessing a forbidden URL.
          this.authService.setState(AuthState.ForbiddenResource);
        } else {
          // The user attempted to load a resource to which they have no access.
          // This mainly happens when there's a difference between two databases (e.g. Postgres and Elastic),
          // causing the user to be able to request resources they should not be able to.
          this.store.dispatch(
            showAlert({
              alert: {
                id: `resource-forbidden`,
                text: this.translateService.instant('resourceForbidden'),
                type: AlertType.Error,
                isPersistent: false,
              },
            })
          );
        }
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
          })
        );
        break;
      default: {
        if (error.status < 500) {
          throw error;
        }

        // In some requests, the error is returned as Blob,
        // which we then need to manually parse to JSON.
        const text =
          error.error instanceof Blob
            ? JSON.parse(await error.error.text()).message
            : error.error.message ?? error.message;
        this.store.dispatch(
          showAlert({
            alert: {
              id: `request-error-${error.status}-${error.url}`,
              text,
              type: AlertType.Error,
              isPersistent: true,
            },
          })
        );
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private initializeStoreSubscription(): void {
    this.subscription.add(
      this.store.select(fromAppShared.selectIsAnonymousMode).subscribe((isAnonymousMode) => {
        this.isAnonymousMode = isAnonymousMode;
      })
    );
  }

  private initializeRouterSubscription(): void {
    this.subscription.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.isNavigating = true;
          this.resetAuthState();
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.isNavigating = false;
          this.resetAuthState();
        }
      })
    );
  }

  private resetAuthState(): void {
    if (this.authService.isLoggedIn() && this.authService.state === AuthState.ForbiddenResource) {
      this.authService.setState(AuthState.Success);
    }
  }
}
