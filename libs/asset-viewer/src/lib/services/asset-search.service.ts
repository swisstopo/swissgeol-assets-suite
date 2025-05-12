import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AssetEditDetail, AssetSearchQuery, AssetSearchStats, AssetSearchStatsDTO } from '@asset-sg/shared';
import { AssetSearchResult, AssetSearchResultDTO } from '@asset-sg/shared/v2';
import { plainToInstance } from 'class-transformer';
import * as E from 'fp-ts/Either';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssetSearchService {
  constructor(private _httpClient: HttpClient) {}

  public search(searchQuery: AssetSearchQuery): Observable<AssetSearchResult> {
    return this._httpClient.post('/api/assets/search?limit=1000', searchQuery).pipe(
      map((res) => plainToInstance(AssetSearchResultDTO, res)));
  }

  public searchStats(searchQuery: AssetSearchQuery): Observable<AssetSearchStats> {
    return this._httpClient
      .post('/api/assets/search/stats', searchQuery)
      .pipe(map((res) => plainToInstance(AssetSearchStatsDTO, res)));
  }

  public fetchAssetEditDetail(assetId: number): Observable<AssetEditDetail> {
    return this._httpClient
      .get(`/api/asset-edit/${assetId}`)
      .pipe(map((res) => (AssetEditDetail.decode(res) as E.Right<AssetEditDetail>).right));
  }
}
