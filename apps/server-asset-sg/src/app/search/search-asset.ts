import { Prisma } from '@prisma/client';
import * as A from 'fp-ts/Array';
import { flow, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';

import {
    DateId,
    DateIdOrd,
    SearchAsset,
    SearchAssetResult,
    SearchAssetResultCodec,
    dateIdFromDate,
    makeUsageCode,
} from '@asset-sg/shared';

import { PostgresAllStudies } from '../postgres-studies/postgres-studies';

import type { AssetQueryResult, AssetQueryResults } from './find-assets-by-polygon';

const makeSearchAssets = (
    assetQueryResults: NEA.NonEmptyArray<AssetQueryResult>,
    studies: PostgresAllStudies,
): NEA.NonEmptyArray<SearchAsset> => {
    const studiesMap = pipe(
        studies,
        NEA.groupBy(a => a.assetId.toString()),
    );
    return pipe(
        assetQueryResults,
        NEA.map((a): SearchAsset => {
            const {
                createDate,
                manCatLabelRefs,
                internalUse,
                publicUse,
                assetLanguages,
                assetContacts,
                ...rest
            } = a;
            return {
                ...rest,
                createDate: dateIdFromDate(createDate),
                manCatLabelItemCodes: manCatLabelRefs.map(m => m.manCatLabelItemCode),
                usageCode: makeUsageCode(publicUse.isAvailable, internalUse.isAvailable),
                languages: assetLanguages.map(a => ({ code: a.languageItemCode })),
                contacts: assetContacts.map(c => ({ role: c.role, id: c.contactId })),
                score: 1,
                studies: pipe(
                    studiesMap,
                    R.lookup(a.assetId.toString()),
                    O.map(ss => ss.map(s => ({ studyId: s.studyId, geomText: s.geomText }))),
                    O.getOrElseW(() => []),
                ),
            };
        }),
    );
};

const makeSearchAssetResultNonEmpty = (assets: NEA.NonEmptyArray<SearchAsset>) => {
    const orderedDates: NEA.NonEmptyArray<DateId> = pipe(
        assets,
        NEA.map(a => a.createDate),
        NEA.uniq(DateIdOrd),
        NEA.sort(DateIdOrd),
    );

    return SearchAssetResultCodec.encode({
        _tag: 'SearchAssetResultNonEmpty',
        aggregations: {
            ranges: { createDate: { min: NEA.head(orderedDates), max: NEA.last(orderedDates) } },
            buckets: {
                authorIds: pipe(
                    assets,
                    A.map(a => a.contacts.filter(c => c.role === 'author').map(c => c.id)),
                    A.flatten,
                    NEA.fromArray,
                    O.map(
                        flow(
                            NEA.groupBy(a => String(a)),
                            R.map(g => ({ key: NEA.head(g), count: g.length })),
                            R.toArray,
                            A.map(([, value]) => value),
                        ),
                    ),
                    O.getOrElseW(() => []),
                ),
                assetKindItemCodes: makeBuckets(
                    pipe(
                        assets,
                        A.map(a => a.assetKindItemCode),
                    ),
                ),
                languageItemCodes: makeBuckets(
                    pipe(
                        assets,
                        A.map(a => a.languages.map((l) => l.code)),
                        A.flatten,
                    ),
                ),
                usageCodes: makeBuckets(
                    pipe(
                        assets,
                        A.map(a => a.usageCode),
                    ),
                ),
                manCatLabelItemCodes: makeBuckets(
                    pipe(
                        assets,
                        A.map(a => a.manCatLabelItemCodes),
                        A.flatten,
                    ),
                ),
            },
        },
        assets,
    });
};

const makeBuckets = <T extends string>(codes: T[]) =>
    pipe(
        codes,
        NEA.fromArray,
        O.map(
            flow(
                NEA.groupBy(a => String(a)),
                R.map(g => ({ key: NEA.head(g), count: g.length })),
                R.toArray,
                A.map(([, value]) => value),
            ),
        ),
        O.getOrElseW(() => []),
    );

const makeSearchAssetResultFromStudiesNonEmpty = (
    assetQueryResults: NEA.NonEmptyArray<AssetQueryResult>,
    studies: PostgresAllStudies,
) => {
    const assets = makeSearchAssets(assetQueryResults, studies);
    return makeSearchAssetResultNonEmpty(assets);
};

export const makeSearchAssetResult = (
    assetQueryResults: AssetQueryResults,
    studies: PostgresAllStudies,
): SearchAssetResult =>
    pipe(
        NEA.fromArray(assetQueryResults),
        O.map(a => makeSearchAssetResultFromStudiesNonEmpty(a, studies)),
        O.getOrElse(() => SearchAssetResultCodec.encode({ _tag: 'SearchAssetResultEmpty' })),
    );

const makeSearchAssetQuery = <T extends Prisma.AssetFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.AssetFindManyArgs>,
) => args;

export const searchAssetQuery = makeSearchAssetQuery({
    select: {
        assetId: true,
        titlePublic: true,
        createDate: true,
        assetKindItemCode: true,
        assetFormatItemCode: true,
        internalUse: { select: { isAvailable: true } },
        publicUse: { select: { isAvailable: true } },
        manCatLabelRefs: { select: { manCatLabelItemCode: true } },
        assetLanguages: { select: { languageItemCode: true } },
        assetContacts: { select: { role: true, contactId: true } },
    },
});
