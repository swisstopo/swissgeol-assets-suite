import { Prisma, PrismaClient } from '@prisma/client';
import { sequenceS } from 'fp-ts/Apply';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { contramap } from 'fp-ts/Eq';
import { flow, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as N from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import * as RR from 'fp-ts/ReadonlyRecord';
import * as R from 'fp-ts/Record';
import * as S from 'fp-ts/string';
import * as TE from 'fp-ts/TaskEither';
import * as D from 'io-ts/Decoder';

import { DT, unknownToError } from '@asset-sg/core';
import {
    DateId,
    DateIdFromDate,
    SearchAssetResultCodec,
    SearchAssetResultOutput,
    UsageCode,
    makeUsageCode,
} from '@asset-sg/shared';

import {
    SearchAssetElasticResult,
    SearchAssetElasticResultDecoder,
    SearchResultsElasticData,
} from '../models/SearchAssetElasticResult';

import { createElasticSearchClient } from './elastic-search-client';

export const searchAssets = (
    prismaClient: PrismaClient,
    searchString: string,
    filterAssetIds: O.Option<number[]>,
): TE.TaskEither<Error, SearchAssetResultOutput> => {
    const client = createElasticSearchClient();

    const filter = pipe(
        filterAssetIds,
        O.map(assetIds => ({
            filter: {
                terms: {
                    assetId: assetIds,
                },
            },
        })),
        O.toUndefined,
    );

    const searchAssetElasticResult = pipe(
        TE.tryCatch(
            () =>
                client.search({
                    index: 'swissgeol_asset_asset',
                    size: 10000,
                    query: {
                        bool: {
                            must: {
                                query_string: {
                                    query: searchString,
                                    fields: ['titlePublic', 'titleOriginal', 'contactNames'],
                                },
                            },
                            ...filter,
                        },
                    },
                    aggs: {
                        authorIds: { terms: { field: 'authorIds' } },
                        minCreateDate: { min: { field: 'createDate' } },
                        maxCreateDate: { max: { field: 'createDate' } },
                        assetKindItemCodes: { terms: { field: 'assetKindItemCode' } },
                        languageItemCodes: { terms: { field: 'languageItemCode' } },
                        usageCodes: { terms: { field: 'usageCode' } },
                        manCatLabelItemCodes: { terms: { field: 'manCatLabelItemCodes' } },
                    },
                    fields: ['assetId'],
                    _source: false,
                }),
            unknownToError,
        ),
        TE.chainW(
            flow(
                SearchAssetElasticResultDecoder.decode,
                E.mapLeft(e => new Error(D.draw(e))),
                TE.fromEither,
            ),
        ),
    );

    const queryDb = (elasticResults: SearchResultsElasticData) =>
        pipe(
            elasticResults.hits.hits.map(a => a.fields.assetId),
            TE.of,
            TE.chain(assetIds =>
                TE.tryCatch(
                    () => prismaClient.$queryRaw`
                            select
        	                    a.asset_id as "assetId",
	                            a.title_public as "titlePublic",
	                            a.create_date as "createDate",
                                a.asset_kind_item_code as "assetKindItemCode",
                                a.asset_format_item_code as "assetFormatItemCode",
                                a.language_item_code as "languageItemCode",
                                mclr.man_cat_label_item_code as "manCatLabelItemCode",
                                ac.contact_id as "contactId",
                                ac.role as "contactRole",
                                ius.is_available as "internalUse",
								pus.is_available as "publicUse",
	                            s.study_id as "studyId",
	                            s.geom_text as "studyGeomText"
                            from
	                            asset a
                            inner join
								internal_use ius
							on  ius.internal_use_id = a.internal_use_id							    
							inner join
								public_use pus
							on  pus.public_use_id = a.public_use_id							    
                            left join
	                            all_study s
                            on  s.asset_id = a.asset_id
                            left join
	                            asset_contact ac
                            on  ac.asset_id = a.asset_id
                            left join
                                man_cat_label_ref mclr
                            on  ac.asset_id = mclr.asset_id
                            where
                                a.asset_id in (${Prisma.join(assetIds)})
                    `,
                    unknownToError,
                ),
            ),
            TE.chainW(
                flow(
                    DBResultList.decode,
                    E.mapLeft(e => new Error(D.draw(e))),
                    TE.fromEither,
                ),
            ),
        );

    const combineResults = (elasticResults: SearchResultsElasticData, dbResults: DBResultList) =>
        SearchAssetResultCodec.encode({
            _tag: 'SearchAssetResultNonEmpty',
            aggregations: {
                ranges: {
                    createDate: {
                        min: elasticResults.aggregations.minCreateDate,
                        max: elasticResults.aggregations.maxCreateDate,
                    },
                },
                buckets: {
                    authorIds: elasticResults.aggregations.authorIds.buckets.map(a => ({
                        key: a.key,
                        count: a.doc_count,
                    })),
                    assetKindItemCodes: elasticResults.aggregations.assetKindItemCodes.buckets.map(a => ({
                        key: a.key,
                        count: a.doc_count,
                    })),
                    languageItemCodes: elasticResults.aggregations.languageItemCodes.buckets.map(a => ({
                        key: a.key,
                        count: a.doc_count,
                    })),
                    usageCodes: elasticResults.aggregations.usageCodes.buckets.map(a => ({
                        key: a.key,
                        count: a.doc_count,
                    })),
                    manCatLabelItemCodes: elasticResults.aggregations.manCatLabelItemCodes.buckets.map(a => ({
                        key: a.key,
                        count: a.doc_count,
                    })),
                },
            },
            assets: pipe(
                dbResults,
                A.map(a => [String(a.assetId), a] as const),
                RR.fromEntries,
                assetsRecord =>
                    pipe(
                        elasticResults.hits.hits,
                        A.map(a =>
                            pipe(
                                R.lookup(String(a.fields.assetId), assetsRecord),
                                O.map(asset => ({ ...asset, score: a._score })),
                            ),
                        ),
                        A.compact,
                    ),
            ),
        });

    return pipe(
        searchAssetElasticResult,
        TE.chain(
            SearchAssetElasticResult.match({
                SearchAssetElasticResultEmpty: () =>
                    TE.of({ _tag: 'SearchAssetResultEmpty' } as SearchAssetResultOutput),
                SearchAssetElasticResultNonEmpty: data =>
                    pipe(
                        queryDb(data),
                        TE.map(dbResults => combineResults(data, dbResults)),
                    ),
            }),
        ),
    );
};

const DBResultRaw = D.struct({
    assetId: D.number,
    titlePublic: D.string,
    contactId: DT.optionFromNullable(D.number),
    contactRole: DT.optionFromNullable(D.string),
    createDate: DateIdFromDate,
    assetKindItemCode: D.string,
    assetFormatItemCode: D.string,
    languageItemCode: D.string,
    manCatLabelItemCode: DT.optionFromNullable(D.string),
    internalUse: D.boolean,
    publicUse: D.boolean,
    studyId: DT.optionFromNullable(D.string),
    studyGeomText: DT.optionFromNullable(D.string),
});
type DBResultRaw = D.TypeOf<typeof DBResultRaw>;

const DBResultRawList = D.array(DBResultRaw);
type DBResultRawList = D.TypeOf<typeof DBResultRawList>;

type DBResult = {
    assetId: number;
    titlePublic: string;
    createDate: DateId;
    assetKindItemCode: string;
    assetFormatItemCode: string;
    languageItemCode: string;
    manCatLabelItemCodes: Array<string>;
    usageCode: UsageCode;
    contacts: Array<{ role: string; id: number }>;
    studies: Array<{ studyId: string; geomText: string }>;
};

const eqStudyByStudyId = contramap((x: { studyId: string; geomText: string }) => x.studyId)(S.Eq);
const eqContactByContactId = contramap((x: { contactId: number; contactRole: string }) => x.contactId)(N.Eq);

const dbResultRawToDBResult = (dbResultRawList: NEA.NonEmptyArray<DBResultRaw>): DBResult => {
    const {
        assetId,
        titlePublic,
        createDate,
        assetFormatItemCode,
        assetKindItemCode,
        languageItemCode,
        internalUse,
        publicUse,
    } = NEA.head(dbResultRawList);
    return {
        assetId,
        titlePublic,
        createDate,
        assetFormatItemCode,
        assetKindItemCode,
        languageItemCode,
        contacts: pipe(
            dbResultRawList,
            NEA.map(x => sequenceS(O.Apply)({ contactId: x.contactId, contactRole: x.contactRole })),
            A.compact,
            A.uniq(eqContactByContactId),
            A.map(a => ({ id: a.contactId, role: a.contactRole })),
        ),
        studies: pipe(
            dbResultRawList,
            NEA.map(x => sequenceS(O.Apply)({ studyId: x.studyId, geomText: x.studyGeomText })),
            A.compact,
            A.uniq(eqStudyByStudyId),
        ),
        manCatLabelItemCodes: pipe(
            dbResultRawList,
            NEA.map(x => x.manCatLabelItemCode),
            A.compact,
            A.uniq(S.Eq),
        ),
        usageCode: makeUsageCode(publicUse, internalUse),
    };
};

const dbResultsRawListToDBResultList = (dbResultRawList: DBResultRawList): Array<DBResult> =>
    pipe(
        dbResultRawList,
        NEA.groupBy(x => String(x.assetId)),
        R.map(dbResultRawToDBResult),
        R.toArray,
        A.map(([, dbResult]) => dbResult),
    );
const DBResultList = pipe(DBResultRawList, D.map(dbResultsRawListToDBResultList));
type DBResultList = D.TypeOf<typeof DBResultList>;
