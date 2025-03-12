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
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly httpClient = inject(HttpClient);

  public getUsers(): Observable<User[]> {
    return this.httpClient.get<object[]>('/api/users').pipe(
      map((it) => plainToInstance(UserSchema, it)),
      map((it) => it.sort((a, b) => a.firstName.localeCompare(b.firstName)))
    );
  }

  public getUser(id: string): Observable<User> {
    return this.httpClient.get<object>(`/api/users/${id}`).pipe(map((it) => plainToInstance(UserSchema, it)));
  }

  public getWorkgroups(): Observable<Workgroup[]> {
    return this.httpClient.get<object[]>('/api/workgroups').pipe(
      map((it) => plainToInstance(WorkgroupSchema, it)),
      map((it) => it.sort((a, b) => a.name.localeCompare(b.name)))
    );
  }

  public getWorkgroup(id: string): Observable<Workgroup> {
    return this.httpClient.get<object>(`/api/workgroups/${id}`).pipe(map((it) => plainToInstance(WorkgroupSchema, it)));
  }

  public createWorkgroup(workgroup: WorkgroupData): Observable<Workgroup> {
    return this.httpClient.post<Workgroup>(`/api/workgroups`, convertWorkgroupData(workgroup));
  }

  public updateWorkgroup(id: number, workgroup: WorkgroupData): Observable<Workgroup> {
    return this.httpClient
      .put<Workgroup>(`/api/workgroups/${id}`, convertWorkgroupData(workgroup))
      .pipe(map((it) => plainToInstance(WorkgroupSchema, it)));
  }

  public deleteWorkgroup(id: number): Observable<void> {
    return this.httpClient.delete<void>(`/api/workgroups/${id}`);
  }

  public updateUser(user: User): Observable<User> {
    return this.httpClient
      .put<User>(
        `/api/users/${user.id}`,
        convert(UserDataSchema, {
          lang: user.lang,
          roles: user.roles,
          isAdmin: user.isAdmin,
          firstName: user.firstName,
          lastName: user.lastName,
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
