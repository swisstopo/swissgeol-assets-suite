import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AssetId } from '@asset-sg/shared/v2';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly httpClient = inject(HttpClient);

  fetchIds(): Observable<AssetId[]> {
    return this.httpClient.get<AssetId[]>(`/api/assets/favorites/ids`);
  }

  create(assetId: AssetId): Observable<void> {
    return this.httpClient.post(`/api/assets/favorites/${assetId}`, null).pipe(map(() => undefined));
  }

  delete(assetId: AssetId): Observable<void> {
    return this.httpClient.delete(`/api/assets/favorites/${assetId}`).pipe(map(() => undefined));
  }
}
