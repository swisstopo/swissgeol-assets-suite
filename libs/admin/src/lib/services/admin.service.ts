import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import { map, startWith, tap } from 'rxjs';

import { ApiError, httpErrorResponseError } from '@asset-sg/client-shared';
import { OE, ORD, decodeError } from '@asset-sg/core';
import { User, Users } from '@asset-sg/shared';

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    private _httpClient = inject(HttpClient);

    public getUsers(): ORD.ObservableRemoteData<ApiError, Users> {
        return this._httpClient.get('/api/admin/user').pipe(
            map(flow(Users.decode, E.mapLeft(decodeError))),
            // TODO need to test instance of HttpErrorResponse here
            OE.catchErrorW(httpErrorResponseError),
            map(RD.fromEither),
            startWith(RD.pending),
        );
    }

    public createUser(user: Omit<User, 'id'>): ORD.ObservableRemoteData<ApiError, void> {
        return this._httpClient
            .post(`/api/admin/user`, {
                email: user.email,
                role: user.role,
                lang: user.lang,
            })
            .pipe(
                map(() => E.right(undefined)),
                // TODO need to test instance of HttpErrorResponse here
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public updateUser(user: User): ORD.ObservableRemoteData<ApiError, void> {
        return this._httpClient
            .patch(`/api/admin/user/${user.id}`, {
                role: user.role,
                lang: user.lang,
            })
            .pipe(
                map(() => E.right(undefined)),
                // TODO need to test instance of HttpErrorResponse here
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public deleteUser(id: string): ORD.ObservableRemoteData<ApiError, void> {
        console.log('888', id);
        // return delayObservable(2000, ORD.success(undefined));
        return this._httpClient.delete(`/api/admin/user/${id}`).pipe(
            tap(a => console.log('deleteUser', a)),
            map(() => E.right(undefined)),
            // TODO need to test instance of HttpErrorResponse here
            OE.catchErrorW(httpErrorResponseError),
            map(RD.fromEither),
            startWith(RD.pending),
            tap(a => console.log('deleteUser', a)),
        );
    }
}
