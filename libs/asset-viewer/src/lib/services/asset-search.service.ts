import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Asset,
  AssetId,
  AssetSchema,
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchResultSchema,
  AssetSearchStats,
  AssetSearchStatsSchema,
  GeometryDetail,
  GeometryDetailSchema,
} from '@asset-sg/shared/v2';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssetSearchService {
  private readonly httpClient = inject(HttpClient);

  public search(searchQuery: AssetSearchQuery): Observable<AssetSearchResult> {
    return this.httpClient
      .post('/api/assets/search?limit=1000', searchQuery)
      .pipe(map((res) => plainToInstance(AssetSearchResultSchema, res)));
  }

  public searchStats(searchQuery: AssetSearchQuery): Observable<AssetSearchStats> {
    return this.httpClient
      .post('/api/assets/search/stats', searchQuery)
      .pipe(map((res) => plainToInstance(AssetSearchStatsSchema, res)));
  }

  public fetchAsset(id: AssetId): Observable<Asset> {
    return this.httpClient.get<object>(`/api/assets/${id}`).pipe(map((res) => plainToInstance(AssetSchema, res)));
  }

  public fetchGeometries(id: AssetId): Observable<GeometryDetail[]> {
    return this.httpClient
      .get<object[]>(`/api/assets/${id}/geometries`)
      .pipe(map((res) => res.map((it) => plainToInstance(GeometryDetailSchema, it))));
  }
}
