import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Role } from '@prisma/client';
import { Observable } from 'rxjs';

//TODO: Move types to /shared2 lib after merging
export interface Workgroup {
  id: number;
  name: string;
  assets: { assetId: number }[];
  users: UserOnWorkgroup[];
  disabled_at: Date | null;
}

export type WorkgroupData = Omit<Workgroup, 'id'>;

export interface WorkgroupOnUser {
  workgroupId: number;
  role: Role;
  workgroup: {
    name: string;
  };
}

export type UserId = string;

export interface UserOnWorkgroup {
  role: Role;
  user: {
    email: string;
    id: UserId;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  lang: string;
  role: Role;
  isAdmin: boolean;
  workgroups: WorkgroupOnUser[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private _httpClient = inject(HttpClient);

  public getUsers(): Observable<User[]> {
    return this._httpClient.get<User[]>('/api/admin/user');
  }

  public getUser(id: string): Observable<User> {
    return this._httpClient.get<User>(`/api/users/${id}`);
  }

  public getWorkgroups(): Observable<Workgroup[]> {
    return this._httpClient.get<Workgroup[]>('/api/workgroups');
  }

  public getWorkgroup(id: string): Observable<Workgroup> {
    return this._httpClient.get<Workgroup>(`/api/workgroups/${id}`);
  }

  public createWorkgroup(workgroup: WorkgroupData): Observable<Workgroup> {
    return this._httpClient.post<Workgroup>(`/api/workgroups`, workgroup);
  }

  public updateWorkgroups(id: number, workgroup: WorkgroupData): Observable<Workgroup> {
    return this._httpClient.put<Workgroup>(`/api/workgroups/${id}`, workgroup);
  }

  public updateUser(user: User): Observable<User> {
    return this._httpClient.put<User>(`/api/users/${user.id}`, {
      role: user.role,
      lang: user.lang,
      workgroups: user.workgroups,
      isAdmin: user.isAdmin,
    });
  }
}
