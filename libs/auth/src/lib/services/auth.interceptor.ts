import { Dialog } from '@angular/cdk/dialog';
import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import { Observable, Subject, exhaustMap, filter, map, retry, shareReplay, startWith, take } from 'rxjs';

import { LoginComponent } from '../components/login';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private loginSignal$ = new Subject<void>();
    private loginResult$ = this.loginSignal$.pipe(
        exhaustMap(() => this.attemptRefreshTokenThenLoginFromComponent().pipe(map(RD.success), startWith(RD.pending))),
        shareReplay({ bufferSize: 1, refCount: false }),
    );

    private dialog = inject(Dialog);

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(req).pipe(
            filter(event => event instanceof HttpResponse),
            retry({
                delay: (error: HttpErrorResponse) => {
                    if (error.status !== 401) {
                        throw error;
                    }
                    return this.login();
                },
            }),
        );
    }

    private login() {
        setTimeout(() => {
            this.loginSignal$.next();
        });
        return this.loginResult$.pipe(filter(RD.isSuccess), take(1));
    }

    private attemptRefreshTokenThenLoginFromComponent() {
        return this.loginFromComponent();
    }

    private loginFromComponent() {
        try {
            const dialogRef = this.dialog.open(LoginComponent, {
                disableClose: true,
            });
            return dialogRef.closed;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }
}
