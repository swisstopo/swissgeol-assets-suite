import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SyncProgress {
  progress: number;
}

@Injectable({ providedIn: 'root' })
export class SyncApiService {
  private readonly httpClient = inject(HttpClient);

  public startSync(): Observable<void> {
    return this.httpClient.post<void>('/api/assets/sync', null);
  }

  public getSyncProgress(): Observable<SyncProgress | null> {
    return this.httpClient.get<SyncProgress | null>('/api/assets/sync');
  }

  public startFullTextSync(): Observable<void> {
    return this.httpClient.post<void>('/api/assets/sync/full-text?reloadFromS3=true', null);
  }

  public getFullTextSyncProgress(): Observable<SyncProgress | null> {
    return this.httpClient.get<SyncProgress | null>('/api/assets/sync/full-text');
  }
}
