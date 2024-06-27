import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, httpErrorResponseError } from '@asset-sg/client-shared';
import { decodeError, OE, ORD } from '@asset-sg/core';
import { Users } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { Role } from '@prisma/client';
import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import { map, Observable, startWith, tap } from 'rxjs';

export interface Workgroup {
  id: number;
  name: string;
  assets: { assetId: number }[];
  users: { userId: number; role: Role }[];
  disabled_at: Date | null;
}

export interface WorkgroupOnUser {
  workgroupId: number;
  role: Role;
  workgroup: {
    name: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  lang: string;
  role: 'Viewer' | 'Editor' | 'MasterEditor';
  isAdmin: boolean;
  workgroups: WorkgroupOnUser[];
}

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
      startWith(RD.pending)
    );
  }

  public getUsersNew(): Observable<User[]> {
    return this._httpClient.get('/api/admin/user').pipe(map((res) => res as User[]));
  }

  public getWorkgroups(): Observable<Workgroup[]> {
    return this._httpClient.get('/api/workgroups').pipe(map((res) => res as Workgroup[]));
  }

  public createWorkgroup(workgroup: Omit<Workgroup, 'id'>): Observable<Workgroup> {
    return this._httpClient.post(`/api/workgroups`, workgroup).pipe(map((res) => res as Workgroup));
  }

  public updateWorkgroups(id: number, workgroup: Omit<Workgroup, 'id'>): Observable<Workgroup> {
    return this._httpClient.put(`/api/workgroups/${id}`, workgroup).pipe(map((res) => res as Workgroup));
  }

  public updateUser(user: User): Observable<User> {
    return this._httpClient
      .put(`/api/users/${user.id}`, {
        role: user.role,
        lang: user.lang,
        workgroups: user.workgroups,
        isAdmin: user.isAdmin,
      })
      .pipe(map((res) => res as User));
  }

  public deleteUser(id: string): ORD.ObservableRemoteData<ApiError, void> {
    console.log('888', id);
    return this._httpClient.delete(`/api/admin/user/${id}`).pipe(
      tap((a) => console.log('deleteUser', a)),
      map(() => E.right(undefined)),
      // TODO need to test instance of HttpErrorResponse here
      OE.catchErrorW(httpErrorResponseError),
      map(RD.fromEither),
      startWith(RD.pending),
      tap((a) => console.log('deleteUser', a))
    );
  }
}
