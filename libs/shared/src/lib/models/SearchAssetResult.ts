import { ADTType, makeADT, ofType } from '@morphic-ts/adt';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';
import { Equals, assert } from 'tsafe';

import { DateId } from './DateStruct';
import { StudyDTOs } from './study-dto';
import { UsageCode } from './usage';

export const SearchAsset = C.struct({
    assetId: C.number,
    titlePublic: C.string,
    createDate: DateId,
    assetKindItemCode: C.string,
    assetFormatItemCode: C.string,
    manCatLabelItemCodes: C.array(C.string),
    score: C.number,
    studies: StudyDTOs,
    languages: C.array(C.struct({ code: C.string })),
    contacts: C.array(C.struct({ role: C.string, id: C.number })),
    usageCode: UsageCode,
});
export interface SearchAsset extends C.TypeOf<typeof SearchAsset> {}

export const SearchAssets = C.array(SearchAsset);
export interface SearchAssets extends C.TypeOf<typeof SearchAssets> {}

export const TextSearchNumberBucket = C.struct({
    key: C.number,
    count: C.number,
});
export interface TextSearchNumberBucket extends C.TypeOf<typeof TextSearchNumberBucket> {}
export const TextSearchNumberBuckets = C.array(TextSearchNumberBucket);
export type TextSearchNumberBuckets = Array<TextSearchNumberBucket>;

export const TextSearchStringBucket = C.struct({
    key: C.string,
    count: C.number,
});
export interface TextSearchStringBucket extends C.TypeOf<typeof TextSearchStringBucket> {}
export const TextSearchStringBuckets = C.array(TextSearchStringBucket);
export type TextSearchStringBuckets = Array<TextSearchStringBucket>;

export const TextBooleanStringBucket = C.struct({
    key: C.boolean,
    count: C.number,
});
export interface TextBooleanStringBucket extends C.TypeOf<typeof TextBooleanStringBucket> {}
export const TextBooleanStringBuckets = C.array(TextBooleanStringBucket);
export type TextBooleanStringBuckets = Array<TextBooleanStringBucket>;

export const SearchAssetRanges = C.struct({
    createDate: C.struct({
        min: DateId,
        max: DateId,
    }),
});
export interface SearchAssetRanges extends C.TypeOf<typeof SearchAssetRanges> {}
export const SearchAssetBuckets = C.struct({
    authorIds: TextSearchNumberBuckets,
    assetKindItemCodes: TextSearchStringBuckets,
    languageItemCodes: TextSearchStringBuckets,
    usageCodes: C.array(C.struct({ key: UsageCode, count: C.number })),
    manCatLabelItemCodes: TextSearchStringBuckets,
});
export interface SearchAssetBuckets extends C.TypeOf<typeof SearchAssetBuckets> {}

export const SearchAssetAggregations = C.struct({
    ranges: SearchAssetRanges,
    buckets: SearchAssetBuckets,
});
export interface SearchAssetAggregations extends C.TypeOf<typeof SearchAssetAggregations> {}

const SearchAssetResultNonEmpty = C.struct({
    _tag: C.literal('SearchAssetResultNonEmpty'),
    aggregations: SearchAssetAggregations,
    assets: SearchAssets,
});
export interface SearchAssetResultNonEmpty extends C.TypeOf<typeof SearchAssetResultNonEmpty> {}

const SearchAssetResultEmpty = C.struct({ _tag: C.literal('SearchAssetResultEmpty') });
interface SearchAssetResultEmpty extends C.TypeOf<typeof SearchAssetResultEmpty> {}

export const SearchAssetResultCodec = C.sum('_tag')({ SearchAssetResultEmpty, SearchAssetResultNonEmpty });

export const SearchAssetResult = makeADT('_tag')({
    SearchAssetResultEmpty: ofType<SearchAssetResultEmpty>(),
    SearchAssetResultNonEmpty: ofType<SearchAssetResultNonEmpty>(),
});

export type SearchAssetResult = ADTType<typeof SearchAssetResult>;
assert<Equals<SearchAssetResult, D.TypeOf<typeof SearchAssetResultCodec>>>();

export type SearchAssetResultOutput = C.OutputOf<typeof SearchAssetResultCodec>;
