import * as RD from '@devexperts/remote-data-ts';
import { ADTType, makeADT, ofType } from '@morphic-ts/adt';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

import { ApiError } from '@asset-sg/client-shared';
import { DateId, SearchAssetAggregations, Studies, UsageCode as UsageCode } from '@asset-sg/shared';

import { SearchAssetResultEmptyError, searchAssetResultEmptyError } from '../utils';

export const SearchAssetClient = D.struct({
    assetId: D.number,
    titlePublic: D.string,
    createDate: DateId,
    assetKindItemCode: D.string,
    assetFormatItemCode: D.string,
    languages: D.array(D.struct({
        code: D.string,
    })),
    manCatLabelItemCodes: D.array(D.string),
    usageCode: UsageCode,
    score: D.number,
    studies: Studies,
    contacts: D.array(D.struct({ role: D.string, id: D.number })),
});
export interface SearchAssetClient extends D.TypeOf<typeof SearchAssetClient> {}

export const SearchAssetsClient = D.array(SearchAssetClient);
export interface SearchAssetsClient extends D.TypeOf<typeof SearchAssetsClient> {}

export const SearchAssetResultNonEmptyClient = D.struct({
    _tag: D.literal('SearchAssetResultNonEmpty'),
    aggregations: SearchAssetAggregations,
    assets: SearchAssetsClient,
});
export interface SearchAssetResultNonEmptyClient extends D.TypeOf<typeof SearchAssetResultNonEmptyClient> {}

export const SearchAssetResultClientDecoder = D.sum('_tag')({
    SearchAssetResultEmpty: D.struct({ _tag: D.literal('SearchAssetResultEmpty') }),
    SearchAssetResultNonEmpty: SearchAssetResultNonEmptyClient,
});

export const SearchAssetResultClient = makeADT('_tag')({
    SearchAssetResultEmpty: ofType<{ _tag: 'SearchAssetResultEmpty' }>(),
    SearchAssetResultNonEmpty: ofType<SearchAssetResultNonEmptyClient>(),
});
export type SearchAssetResultClient = ADTType<typeof SearchAssetResultClient>;

export const foldSearchAssetResultClient = <A>(
    onEmpty: () => A,
    onNonEmpty: (a: SearchAssetResultNonEmptyClient) => A,
) =>
    SearchAssetResultClient.matchStrict<A>({
        SearchAssetResultNonEmpty: onNonEmpty,
        SearchAssetResultEmpty: onEmpty,
    });

export const mapSearchAssetResultNonEmptyToRD = <B>(
    a: SearchAssetResultClient,
    f: (a: SearchAssetResultNonEmptyClient) => B,
) =>
    SearchAssetResultClient.matchStrict<RD.RemoteData<ApiError | SearchAssetResultEmptyError, B>>({
        SearchAssetResultNonEmpty: result => RD.success(f(result)),
        SearchAssetResultEmpty: () => RD.failure(searchAssetResultEmptyError()),
    })(a);

export const mapRDSearchAssetResultNonEmpty =
    <B>(f: (a: SearchAssetResultNonEmptyClient) => B) =>
    (a: RD.RemoteData<ApiError, SearchAssetResultClient>) =>
        pipe(
            a,
            RD.chain(b => mapSearchAssetResultNonEmptyToRD(b, f)),
        );
