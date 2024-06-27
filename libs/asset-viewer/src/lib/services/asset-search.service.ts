import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppState } from '@asset-sg/client-shared';
import {
  AssetEditDetail,
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchResultDTO,
  AssetSearchStats,
  AssetSearchStatsDTO,
} from '@asset-sg/shared';
import { Store } from '@ngrx/store';
import { plainToInstance } from 'class-transformer';
import * as E from 'fp-ts/Either';
import { map, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssetSearchService {
  constructor(private _httpClient: HttpClient, private store: Store<AppState>) {}

  public search(searchQuery: AssetSearchQuery): Observable<AssetSearchResult> {
    return this._httpClient.post('/api/assets/search?limit=10000', searchQuery).pipe(
      map((res) => plainToInstance(AssetSearchResultDTO, res)),
      tap((result) => {
        result.data = result.data.map((asset) => (AssetEditDetail.decode(asset) as E.Right<AssetEditDetail>).right);
      })
    );
  }

  public loadAssetDetailData(assetId: number): Observable<AssetEditDetail> {
    return this._httpClient
      .get(`/api/asset-edit/${assetId}`)
      .pipe(map((res) => (AssetEditDetail.decode(res) as E.Right<AssetEditDetail>).right));
  }

  public updateSearchResultStats(searchQuery: AssetSearchQuery): Observable<AssetSearchStats> {
    return this._httpClient
      .post('/api/assets/search/stats', searchQuery)
      .pipe(map((res) => plainToInstance(AssetSearchStatsDTO, res)));
  }
}
