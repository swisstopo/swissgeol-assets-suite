import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import queryString from 'query-string';
import { map, startWith } from 'rxjs';

import { ApiError, httpErrorResponseError } from '@asset-sg/client-shared';
import { OE, ORD, decodeError } from '@asset-sg/core';
import { AssetSearchParamsOld, LV95, ReferenceData } from '@asset-sg/shared';

import { AssetDetail, SearchAssetResultClient, SearchAssetResultClientDecoder } from '../models';
import { AssetSearchParamsToQueryString } from '../models/asset-search-params';

@Injectable({ providedIn: 'root' })
export class AssetSearchService {
    constructor(private _httpClient: HttpClient) {}

    public search(searchText: string): ORD.ObservableRemoteData<ApiError, SearchAssetResultClient> {
        const qs = queryString.stringify(
            AssetSearchParamsOld.encode({
                searchText,
            }),
            { skipNull: true },
        );
        return this._httpClient
            .get('/api/search-asset?' + qs)
            .pipe(
                map(flow(SearchAssetResultClientDecoder.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public searchByPolygon(polygon: LV95[]): ORD.ObservableRemoteData<ApiError, SearchAssetResultClient> {
        const qs = AssetSearchParamsToQueryString.encode({ filterKind: 'polygon', polygon, searchText: O.none });
        return this._httpClient
            .get('/api/asset/?' + qs)
            .pipe(
                map(flow(SearchAssetResultClientDecoder.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public searchByPolygonRefineBySearchText(
        polygon: LV95[],
        searchText: string,
    ): ORD.ObservableRemoteData<ApiError, SearchAssetResultClient> {
        const qs = AssetSearchParamsToQueryString.encode({
            filterKind: 'polygon',
            polygon,
            searchText: O.some(searchText),
        });
        return this._httpClient
            .get('/api/asset/?' + qs)
            .pipe(
                map(flow(SearchAssetResultClientDecoder.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public loadReferenceData(): ORD.ObservableRemoteData<ApiError, ReferenceData> {
        return this._httpClient
            .get('/api/reference-data')
            .pipe(
                map(flow(ReferenceData.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public loadAssetDetailData(assetId: number): ORD.ObservableRemoteData<ApiError, AssetDetail> {
        return this._httpClient
            .get(`/api/asset-detail/${assetId}`)
            .pipe(
                map(flow(AssetDetail.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }
}
