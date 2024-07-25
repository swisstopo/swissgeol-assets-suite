import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  convert,
  User,
  UserData,
  UserDataSchema,
  UserSchema,
  Workgroup,
  WorkgroupData,
  WorkgroupDataSchema,
  WorkgroupSchema,
} from '@asset-sg/shared/v2';
import { plainToInstance } from 'class-transformer';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private _httpClient = inject(HttpClient);

  public getUsers(): Observable<User[]> {
    return this._httpClient.get<object[]>('/api/users').pipe(map((it) => plainToInstance(UserSchema, it)));
  }

  public getUser(id: string): Observable<User> {
    return this._httpClient.get<object>(`/api/users/${id}`).pipe(map((it) => plainToInstance(UserSchema, it)));
  }

  public getWorkgroups(): Observable<Workgroup[]> {
    return this._httpClient.get<object[]>('/api/workgroups').pipe(map((it) => plainToInstance(WorkgroupSchema, it)));
  }

  public getWorkgroup(id: string): Observable<Workgroup> {
    return this._httpClient
      .get<object>(`/api/workgroups/${id}`)
      .pipe(map((it) => plainToInstance(WorkgroupSchema, it)));
  }

  public createWorkgroup(workgroup: WorkgroupData): Observable<Workgroup> {
    return this._httpClient.post<Workgroup>(`/api/workgroups`, convertWorkgroupData(workgroup));
  }

  public updateWorkgroup(id: number, workgroup: WorkgroupData): Observable<Workgroup> {
    return this._httpClient
      .put<Workgroup>(`/api/workgroups/${id}`, convertWorkgroupData(workgroup))
      .pipe(map((it) => plainToInstance(WorkgroupSchema, it)));
  }

  public updateUser(user: User): Observable<User> {
    return this._httpClient
      .put<User>(
        `/api/users/${user.id}`,
        convert(UserDataSchema, {
          lang: user.lang,
          roles: user.roles,
          isAdmin: user.isAdmin,
        } as UserData)
      )
      .pipe(map((it) => plainToInstance(UserSchema, it)));
  }
}

const convertWorkgroupData = (data: WorkgroupData): WorkgroupData =>
  convert(WorkgroupDataSchema, {
    name: data.name,
    users: data.users,
    disabledAt: data.disabledAt,
  } as WorkgroupData);
