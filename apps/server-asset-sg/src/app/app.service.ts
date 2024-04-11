import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { sequenceS } from 'fp-ts/Apply';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { contramap } from 'fp-ts/Eq';
import { flow, Lazy, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as N from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import * as RR from 'fp-ts/ReadonlyRecord';
import * as R from 'fp-ts/Record';
import * as S from 'fp-ts/string';
import * as TE from 'fp-ts/TaskEither';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

import { decodeError, DT, isNotNil, unknownToError, unknownToUnknownError } from '@asset-sg/core';
import {
    AssetSearchParams,
    BaseAssetDetail,
    DateId,
    DateIdFromDate,
    makeUsageCode,
    SearchAssetResult,
    SearchAssetResultCodec,
    SearchAssetResultOutput,
    UsageCode,
} from '@asset-sg/shared';

import { notFoundError } from './errors';
import { getFile } from './file/get-file';
import { AssetDetailFromPostgres } from './models/AssetDetailFromPostgres';
import {
    SearchAssetElasticResult,
    SearchAssetElasticResultDecoder,
    SearchResultsElasticData,
} from './models/SearchAssetElasticResult';
import {
    createAllStudyQuery,
    decodeStudyQueryResult,
    postgresStudiesByAssetId,
} from './postgres-studies/postgres-studies';
import { PrismaService } from './prisma/prisma.service';
import { createElasticSearchClient } from './search/elastic-search-client';
import { executeAssetQuery, findAssetsByPolygon } from './search/find-assets-by-polygon';
import { searchAssets } from './search/find-assets-by-search-text';
import { makeSearchAssetResult } from './search/search-asset';

@Injectable()
export class AppService {
    constructor(private readonly prismaService: PrismaService) {}

    async getData(polygon: [number, number][]) {
        const polygonParam = polygon.map(point => `${point[0]} ${point[1]}`).join(',');

        const result = await this.prismaService.$queryRawUnsafe(
            `select id, accident_uid, year, month, canton, ST_AsText(geom) as geom
       from bicycle_accidents
       where ST_INTERSECTS(geom, ST_GeomFromText('POLYGON((${polygonParam}))', 2056))`,
        );
        return { result };
    }

    async getAllStudies() {
        const rawData: { studyId: string; isPoint: boolean; centroidGeomText: string }[] =
            await this.prismaService.$queryRawUnsafe(
                'select study_id as "studyId", is_point as "isPoint", centroid_geom_text as "centroidGeomText" from public.all_study',
            );

        return rawData.map(study => ({
            studyId: study.studyId,
            isPoint: study.isPoint,
            centroid: study.centroidGeomText.replace('POINT(', '').replace(')', ''),
        }));
    }

    getFile(fileId: number) {
        return getFile(this.prismaService, fileId);
    }

    searchAssets2(query: unknown): TE.TaskEither<Error, SearchAssetResult> {
        return pipe(
            TE.fromEither(AssetSearchParams.decode(query)),
            TE.mapLeft(e => new Error(D.draw(e))),
            TE.chainW(a => {
                switch (a.filterKind) {
                    case 'polygon':
                        return pipe(
                            a.searchText,
                            O.fold(
                                () => findAssetsByPolygon(this.prismaService, a.polygon),
                                searchText =>
                                    pipe(
                                        findAssetsByPolygon(this.prismaService, a.polygon),
                                        TE.chainW(
                                            SearchAssetResult.matchStrict({
                                                SearchAssetResultNonEmpty: result =>
                                                    searchAssets(
                                                        this.prismaService,
                                                        normaliseSearchString(searchText),
                                                        pipe(
                                                            O.some(result.assets),
                                                            O.map(assets => assets.map(asset => asset.assetId)),
                                                        ),
                                                    ),
                                                SearchAssetResultEmpty: TE.of,
                                            }),
                                        ),
                                    ),
                            ),
                        );
                    case 'searchText':
                        // TODO: now callSearchAssets with O.none as third parameter
                        return TE.of(1) as unknown as TE.TaskEither<Error, SearchAssetResult>;
                }
            }),
        );
    }

    // findAssetsByPolygon(polygon: [number, number][]) {
    //     return findAssetsByPolygon(this.prismaService, polygon);
    // }

    searchAssetsByStudyIds(ids: string[]): TE.TaskEither<Error, SearchAssetResult> {
        const whereClause = `study_id in (${ids.map(id => `'${id}'`).join(',')})`;
        return pipe(
            TE.tryCatch(() => this.prismaService.$queryRawUnsafe(createAllStudyQuery(whereClause)), unknownToError),
            TE.chain(decodeStudyQueryResult),
            TE.chain(studies => {
                const assetIds = studies.map(study => study.assetId);
                return pipe(
                    executeAssetQuery(this.prismaService, assetIds),
                    TE.map(assets => [assets, studies] as const),
                );
            }),
            TE.map(([assets, studies]) => {
                return makeSearchAssetResult(assets, studies);
            }),
        );
    }

    // findAssetsByPolygon(polygon: [number, number][]) {
    //     const polygonParam = polygon.map(point => `${point[0]} ${point[1]}`).join(',');

    //     return pipe(
    //         TE.tryCatch(
    //             () =>
    //                 this.prismaService.$queryRawUnsafe(`
    //                     select
    //                         a.asset_id as "assetId",
    //                         a.title_public as "titlePublic",
    //                         a.create_date as "createDateId",
    //                         a.asset_kind_item_code as "assetKindItemCode",
    //                         a.asset_format_item_code as "assetFormatItemCode",
    //                         mclr.man_cat_label_item_code as "manCatLabelItemCode",
    //                         ac.contact_id as "contactId",
    //                         ac.role as "contactRole",
    //                         s.study_id as "studyId",
    //                         s.geom_text as "studyGeomText"
    //                     from all_study s
    //                     inner join asset a
    //                         on s.asset_id = a.asset_id
    //                     left join
    //                         asset_contact ac
    //                     on  ac.asset_id = a.asset_id
    //                     left join
    //                         man_cat_label_ref mclr
    //                     on  ac.asset_id = mclr.asset_id
    //                     where
    //                         st_intersects(geom, st_geomfromtext('polygon((${polygonParam}))', 2056))
    //                     order by
    //                         a.asset_id
    //                 `),
    //             unknownToError,
    //         ),
    //         TE.chainW(
    //             flow(
    //                 DBResultList.decode,
    //                 E.mapLeft(e => new Error(D.draw(e))),
    //                 TE.fromEither,
    //             ),
    //         ),
    //         TE.map(
    //             flow(
    //                 NEA.fromArray,
    //                 O.map(assets => {
    //                     const orderedDates: NEA.NonEmptyArray<DateId> = pipe(
    //                         assets,
    //                         NEA.map(a => a.createDate),
    //                         NEA.uniq(DateIdOrd),
    //                         NEA.sort(DateIdOrd),
    //                     );
    //                     return SearchAssetResult.encode({
    //                         _tag: 'SearchAssetResultNonEmpty',
    //                         aggregations: {
    //                             ranges: { createDate: { min: NEA.head(orderedDates), max: NEA.last(orderedDates) } },
    //                             buckets: {
    //                                 authorIds: pipe(
    //                                     assets,
    //                                     A.map(a => a.contacts.filter(c => c.role === 'author').map(c => c.id)),
    //                                     A.flatten,
    //                                     NEA.fromArray,
    //                                     O.map(
    //                                         flow(
    //                                             NEA.groupBy(a => String(a)),
    //                                             R.map(g => ({ key: NEA.head(g), count: g.length })),
    //                                             R.toArray,
    //                                             A.map(([, value]) => value),
    //                                         ),
    //                                     ),
    //                                     O.getOrElseW(() => []),
    //                                 ),
    //                             },
    //                         },
    //                         assets: assets.map(asset => ({ ...asset, score: 1 })),
    //                     });
    //                 }),
    //                 O.getOrElse(() => SearchAssetResult.encode({ _tag: 'SearchAssetResultEmpty' })),
    //             ),
    //         ),
    //     );
    // }

    // async findStudiesByPolygon(polygon: [number, number][]) {
    //     const polygonParam = polygon.map(point => `${point[0]} ${point[1]}`).join(',');

    //     console.log(
    //         `select study_id as "studyId", geom_text as "geomText", asset_id as "assetId" from public.all_study where st_intersects(geom, st_geomfromtext('polygon((${polygonParam}))', 2056))`,
    //     );

    //     return await this.prismaService.$queryRawUnsafe(
    //         `select study_id as "studyId", geom_text as "geomText", asset_id as "assetId"
    //          from public.all_study
    //          where st_intersects(geom, st_geomfromtext('polygon((${polygonParam}))', 2056))`,
    //     );
    // }

    // async findStudiesByAssetId(assetId: number) {
    //     return await this.prismaService.$queryRawUnsafe(
    //         `select study_id as "studyId", geom_text as "geomText", asset_id as "assetId"
    //          from public.all_study
    //          where asset_id=${assetId}}`,
    //     );
    // }

    searchAssets(searchString: string): TE.TaskEither<Error, SearchAssetResultOutput> {
        const client = createElasticSearchClient();

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
                                        query: normaliseSearchString(searchString),
                                        fields: ['titlePublic', 'titleOriginal', 'contactNames', 'sgsId'],
                                    },
                                },
                            },
                        },
                        aggs: {
                            authorIds: { terms: { field: 'authorIds', size: 1000 } },
                            minCreateDate: { min: { field: 'createDate' } },
                            maxCreateDate: { max: { field: 'createDate' } },
                            assetKindItemCodes: { terms: { field: 'assetKindItemCode' } },
                            manCatLabelItemCodes: { terms: { field: 'manCatLabelItemCodes' } },
                            languageItemCodes: { terms: { field: 'languageItemCode' } },
                            usageCodes: { terms: { field: 'usageCode' } },
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
                        () => this.prismaService.$queryRaw`
              select a.asset_id                   as "assetId",
                     a.title_public               as "titlePublic",
                     a.create_date                as "createDate",
                     a.asset_kind_item_code       as "assetKindItemCode",
                     a.asset_format_item_code     as "assetFormatItemCode",
                     a.language_item_code         as "languageItemCode",
                     mclr.man_cat_label_item_code as "manCatLabelItemCode",
                     ac.contact_id                as "contactId",
                     ac.role                      as "contactRole",
                     ius.is_available             as "internalUse",
                     pus.is_available             as "publicUse",
                     s.study_id                   as "studyId",
                     s.geom_text                  as "studyGeomText"
              from asset a
                     inner join
                   internal_use ius
                   on ius.internal_use_id = a.internal_use_id
                     inner join
                   public_use pus
                   on pus.public_use_id = a.public_use_id
                     left join
                   all_study s
                   on s.asset_id = a.asset_id
                     left join
                   asset_contact ac
                   on ac.asset_id = a.asset_id
                     left join
                   man_cat_label_ref mclr
                   on ac.asset_id = mclr.asset_id
              where a.asset_id in (${Prisma.join(assetIds)})
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
                        languageItemCodes: elasticResults.aggregations.languageItemCodes.buckets.map(a => ({
                            key: a.key,
                            count: a.doc_count,
                        })),
                        usageCodes: elasticResults.aggregations.usageCodes.buckets.map(a => ({
                            key: a.key,
                            count: a.doc_count,
                        })),
                        assetKindItemCodes: elasticResults.aggregations.assetKindItemCodes.buckets.map(a => ({
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
    }

    getReferenceData() {
        const qt = <A, K extends keyof A>(f: Lazy<Promise<A[]>>, key: K, newKey: string) =>
            pipe(
                TE.tryCatch(f, unknownToError),
                TE.map(
                    flow(
                        A.map(({ [key]: _key, ...rest }) => [_key as string, { [newKey]: _key, ...rest }] as const),
                        RR.fromEntries,
                    ),
                ),
            );

        const queries = {
            assetFormatItems: qt(() => this.prismaService.assetFormatItem.findMany(), 'assetFormatItemCode', 'code'),
            assetKindItems: qt(() => this.prismaService.assetKindItem.findMany(), 'assetKindItemCode', 'code'),
            autoCatLabelItems: qt(() => this.prismaService.autoCatLabelItem.findMany(), 'autoCatLabelItemCode', 'code'),
            autoObjectCatItems: qt(
                () => this.prismaService.autoObjectCatItem.findMany(),
                'autoObjectCatItemCode',
                'code',
            ),
            contactKindItems: qt(() => this.prismaService.contactKindItem.findMany(), 'contactKindItemCode', 'code'),
            geomQualityItems: qt(() => this.prismaService.geomQualityItem.findMany(), 'geomQualityItemCode', 'code'),
            languageItems: qt(() => this.prismaService.languageItem.findMany(), 'languageItemCode', 'code'),
            legalDocItems: qt(() => this.prismaService.legalDocItem.findMany(), 'legalDocItemCode', 'code'),
            manCatLabelItems: qt(() => this.prismaService.manCatLabelItem.findMany(), 'manCatLabelItemCode', 'code'),
            natRelItems: qt(() => this.prismaService.natRelItem.findMany(), 'natRelItemCode', 'code'),
            pubChannelItems: qt(() => this.prismaService.pubChannelItem.findMany(), 'pubChannelItemCode', 'code'),
            statusAssetUseItems: qt(
                () => this.prismaService.statusAssetUseItem.findMany(),
                'statusAssetUseItemCode',
                'code',
            ),
            statusWorkItems: qt(() => this.prismaService.statusWorkItem.findMany(), 'statusWorkItemCode', 'code'),
            contacts: qt(() => this.prismaService.contact.findMany(), 'contactId', 'id'),
        };

        return pipe(queries, sequenceS(TE.ApplicativeSeq));
    }

    getAssetDetail(assetId: number) {
        const AssetDetail = C.struct({
            ...BaseAssetDetail,
            studies: C.array(C.struct({ assetId: C.number, studyId: C.string, geomText: C.string })),
        });
        return pipe(
            TE.tryCatch(
                () =>
                    this.prismaService.asset.findUnique({
                        where: { assetId },
                        select: {
                            assetId: true,
                            titlePublic: true,
                            titleOriginal: true,
                            createDate: true,
                            lastProcessedDate: true,
                            assetKindItemCode: true,
                            assetFormatItemCode: true,
                            languageItemCode: true,
                            internalUse: { select: { isAvailable: true } },
                            publicUse: { select: { isAvailable: true } },
                            ids: { select: { id: true, description: true } },
                            assetContacts: {
                                select: {
                                    role: true,
                                    contact: { select: { name: true, locality: true, contactKindItemCode: true } },
                                },
                            },
                            manCatLabelRefs: { select: { manCatLabelItemCode: true } },
                            assetFormatCompositions: { select: { assetFormatItemCode: true } },
                            typeNatRels: { select: { natRelItemCode: true } },
                            assetMain: { select: { assetId: true, titlePublic: true } },
                            subordinateAssets: { select: { assetId: true, titlePublic: true } },
                            siblingYAssets: { select: { assetX: { select: { assetId: true, titlePublic: true } } } },
                            siblingXAssets: { select: { assetY: { select: { assetId: true, titlePublic: true } } } },
                            statusWorks: { select: { statusWorkItemCode: true, statusWorkDate: true } },
                            assetFiles: { select: { file: true } },
                        },
                    }),
                unknownToUnknownError,
            ),
            TE.chainW(TE.fromPredicate(isNotNil, notFoundError)),
            TE.chainW(a =>
                pipe(
                    postgresStudiesByAssetId(this.prismaService, a.assetId),
                    TE.map(studies => ({ ...a, studies })),
                ),
            ),
            TE.chainW(a => pipe(TE.fromEither(AssetDetailFromPostgres.decode(a)), TE.mapLeft(decodeError))),
            TE.map(AssetDetail.encode),
        );
    }
}

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

const normaliseSearchString = (searchString: string) => {
    const replaceForSearchStringNormalisation: [RegExp, string][] = [
        [/title(_*)public:/i, 'titlePublic:'],
        [/title(_*)original:/i, 'titleOriginal:'],
        [/contact(_*)name(s*):/i, 'contactNames:'],
        [/sgs(_*)id:/i, 'sgsId:'],
    ];

    return replaceForSearchStringNormalisation.reduce(
        (acc, [regex, replacement]) => acc.replace(regex, replacement),
        searchString,
    );
};
