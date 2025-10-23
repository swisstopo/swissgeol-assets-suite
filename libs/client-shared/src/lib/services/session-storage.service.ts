import { Injectable } from '@angular/core';

type SessionStorageKey = 'session.callback_path' | 'access_token';
@Injectable({ providedIn: 'root' })
export class SessionStorageService {
  public set(key: SessionStorageKey, value: string): void {
    sessionStorage.setItem(key, value);
  }

  public get(key: SessionStorageKey): string | null {
    return sessionStorage.getItem(key);
  }

  public unset(key: SessionStorageKey): void {
    sessionStorage.removeItem(key);
  }
}
