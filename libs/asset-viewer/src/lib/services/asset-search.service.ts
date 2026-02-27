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
  FileSearchResult,
  FileSearchResultSchema,
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

  public searchFiles(searchQuery: AssetSearchQuery, limit = 100, offset = 0): Observable<FileSearchResult> {
    return this.httpClient
      .post(`/api/files/search?limit=${limit}&offset=${offset}`, searchQuery)
      .pipe(map((res) => plainToInstance(FileSearchResultSchema, res)));
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
