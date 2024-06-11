import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { BulkOperationContainer, QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';

import {
    AssetByTitle,
    DateId,
    ElasticSearchAsset,
    SearchAssetAggregations,
    SearchAssetResult,
    UsageCode,
    dateIdFromDate,
    makeUsageCode,
} from '@asset-sg/shared';

import { AssetEditDetail } from '../asset-edit/asset-edit.service';
import { AssetEditDetailFromPostgres } from '../models/asset-edit-detail';
import { PrismaService } from '../prisma/prisma.service';
import { AssetRepo } from '../repos/asset.repo';

const INDEX = 'swissgeol_asset_asset';
export { INDEX as ASSET_ELASTIC_INDEX };

interface SearchOptions {
    scope: Array<keyof ElasticSearchAsset>
    assetIds?: number[]
}

interface ElasticSearchResult {
    scoresByAssetId: Map<number, number>
    aggs: SearchAssetAggregations
}

@Injectable()
export class AssetSearchService {
    constructor(
        private readonly elastic: ElasticsearchClient,
        private readonly prisma: PrismaService,
        private readonly assetRepo: AssetRepo,
    ) {
    }

    async register(oneOrMore: AssetEditDetail | AssetEditDetail[]): Promise<void> {
        const assets = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
        const elasticAssets = await Promise.all(assets.map((asset) => this.mapAssetToElastic(asset)))
        const operations = elasticAssets.reduce((ops, elasticAsset) => {
            ops.push(
                { index: { _index: INDEX, _id: `${elasticAsset.assetId}` } },
                elasticAsset,
            )
            return ops;
        }, [] as Array<BulkOperationContainer | ElasticSearchAsset>);
        await this.elastic.bulk({
            index: INDEX,
            refresh: true,
            operations,
        })
    }

    async syncWithDatabase(onProgress?: (percentage: number) => (void | Promise<void>)): Promise<void> {
        // Delete all assets stored in elasticsearch.
        await this.elastic.deleteByQuery({
            index: INDEX,
            query: { match_all: {} },
            refresh: true,
        })

        const total = await this.prisma.asset.count();

        let offset = 0;
        for (;;) {
            const records = await this.assetRepo.list({ limit: 1_00, offset });
            if (records.length === 0) {
                break;
            }
            await this.register(records);
            offset += records.length;
            if (onProgress != null) {
                await onProgress(offset / total);
            }
        }
    }

    async search(query: string, options: SearchOptions): Promise<SearchAssetResult> {
        const elasticResult = await this.searchElastic(query, options);
        return await this.loadAssetsByElasticResult(elasticResult);
    }

    async searchByTitle(title: string): Promise<AssetByTitle[]> {
        interface SearchHit {
            _score: number;
            fields: {
                assetId: [number]
                titlePublic: [string]
            };
        }

        const response = await this.elastic.search({
            index: INDEX,
            size: 10_000,
            query: {
                bool: {
                    must: {
                        query_string: {
                            query: `*${title}*`,
                            fields: ['titlePublic'],
                        },
                    },
                },
            },
            fields: ['assetId', 'titlePublic'],
            _source: false,
        });
        return (response.hits.hits as unknown as SearchHit[]).map((hit) => ({
            score: hit._score,
            assetId: hit.fields.assetId[0],
            titlePublic: hit.fields.titlePublic[0],
        }));
    }

    private async searchElastic(
        query: string,
        { scope, assetIds }: SearchOptions,
    ): Promise<ElasticSearchResult> {
        const filters: QueryDslQueryContainer[] = [];
        if (assetIds != null) {
            filters.push({ terms: { assetId: assetIds } });
        }

        const response = await this.elastic.search({
            index: INDEX,
            size: 10_000,
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query,
                                fields: scope,
                                fuzziness: 'AUTO',
                            },
                        },
                        {
                            query_string: {
                                query: `*${query}*`,
                                fields: scope,
                            },
                        },
                    ],
                    filter: filters,
                },
            },
            aggs: {
                authorIds: { terms: { field: 'authorIds' } },
                minCreateDate: { min: { field: 'createDate' } },
                maxCreateDate: { max: { field: 'createDate' } },
                assetKindItemCodes: { terms: { field: 'assetKindItemCode' } },
                languageItemCodes: { terms: { field: 'languageItemCode.keyword' } },
                usageCodes: { terms: { field: 'usageCode' } },
                manCatLabelItemCodes: { terms: { field: 'manCatLabelItemCodes' } },
            },
            fields: ['assetId'],
            _source: false,
        });

        interface ElasticSearchResult {
            hits: {
                hits: Array<{
                    _score: number
                    fields: {
                        assetId: [number]
                    }
                }>
            };
            aggregations: {
                minCreateDate: { value: DateId }
                maxCreateDate: { value: DateId }
                authorIds: {
                    buckets: AggregationBucket<number>[]
                }
                assetKindItemCodes: {
                    buckets: AggregationBucket[]
                }
                languageItemCodes: {
                    buckets: AggregationBucket[]
                }
                usageCodes: {
                    buckets: AggregationBucket<UsageCode>[]
                }
                manCatLabelItemCodes: {
                    buckets: AggregationBucket[]
                }
            };
        }

        interface AggregationBucket<K = string> {
            key: K;
            doc_count: number;
        }

        const { aggregations: aggs, hits } = response as unknown as ElasticSearchResult;
        const scoresByAssetId = new Map<number, number>();
        for (const hit of hits.hits) {
            scoresByAssetId.set(hit.fields.assetId[0], hit._score);
        }
        const searchAggs: SearchAssetAggregations = {
            ranges: {
                createDate: {
                    min: aggs.minCreateDate.value,
                    max: aggs.maxCreateDate.value,
                },
            },
            buckets: {
                authorIds: aggs.authorIds.buckets.map(agg => ({
                    key: agg.key,
                    count: agg.doc_count,
                })),
                assetKindItemCodes: aggs.assetKindItemCodes.buckets.map(agg => ({
                    key: agg.key,
                    count: agg.doc_count,
                })),
                languageItemCodes: aggs.languageItemCodes.buckets.map(agg => ({
                    key: agg.key,
                    count: agg.doc_count,
                })),
                usageCodes: aggs.usageCodes.buckets.map(agg => ({
                    key: agg.key,
                    count: agg.doc_count,
                })),
                manCatLabelItemCodes: aggs.manCatLabelItemCodes.buckets.map(agg => ({
                    key: agg.key,
                    count: agg.doc_count,
                })),
            },
        };

        return { scoresByAssetId, aggs: searchAggs };
    }

    private async loadAssetsByElasticResult({
        scoresByAssetId,
        aggs,
    }: ElasticSearchResult): Promise<SearchAssetResult> {
        if (scoresByAssetId.size === 0) {
            return { _tag: 'SearchAssetResultEmpty' }
        }
        const entities = await this.prisma.asset.findMany({
            where: {
                assetId: { in: [...scoresByAssetId.keys()] },
            },
            select: {
                assetId: true,
                titlePublic: true,
                createDate: true,
                assetKindItemCode: true,
                assetFormatItemCode: true,
                languageItemCode: true,
                internalUse: {
                    select: {
                        isAvailable: true,
                    },
                },
                publicUse: {
                    select: {
                        isAvailable: true,
                    },
                },
                allStudies: {
                    select: {
                        studyId: true,
                        geomText: true,
                    },
                },
                assetContacts: {
                    select: {
                        contactId: true,
                        role: true,
                    },
                },
                manCatLabelRefs: {
                    select: {
                        manCatLabelItemCode: true,
                    },
                },
            },
        });
        return {
            _tag: 'SearchAssetResultNonEmpty',
            aggregations: aggs,
            assets: entities.map((entity) => {
                const { assetId } = entity;
                const score = scoresByAssetId.get(assetId);
                if (score == null) {
                    throw new Error(`found prisma entity that was not part of the elastic result: ${assetId}`);
                }
                return {
                    score,
                    assetId,
                    titlePublic: entity.titlePublic,
                    createDate: dateIdFromDate(entity.createDate),
                    assetFormatItemCode: entity.assetFormatItemCode,
                    assetKindItemCode: entity.assetKindItemCode,
                    languageItemCode: entity.languageItemCode,
                    contacts: entity.assetContacts.map((contact) => ({
                        id: contact.contactId,
                        role: contact.role,
                    })),
                    studies: entity.allStudies,
                    manCatLabelItemCodes: entity.manCatLabelRefs.map((ref) => ref.manCatLabelItemCode),
                    usageCode: makeUsageCode(entity.publicUse.isAvailable, entity.internalUse.isAvailable),
                };
            }),
        };
    }

    private async mapAssetToElastic(asset: AssetEditDetailFromPostgres): Promise<ElasticSearchAsset> {
        const contacts = await this.prisma.contact.findMany({
            select: {
                name: true,
            },
            where: {
                contactId: { in: asset.assetContacts.map((it) => it.contactId) },
            },
        })
        return {
            assetId: asset.assetId,
            titlePublic: asset.titlePublic,
            titleOriginal: asset.titleOriginal,
            sgsId: asset.sgsId,
            createDate: asset.createDate,
            assetKindItemCode: asset.assetKindItemCode,
            languageItemCode: asset.languageItemCode,
            usageCode: makeUsageCode(asset.publicUse.isAvailable, asset.internalUse.isAvailable),
            authorIds: asset.assetContacts.filter((it) => it.role === 'author').map((it) => it.contactId),
            contactNames: contacts.map((it) => it.name), // TODO
            manCatLabelItemCodes: asset.manCatLabelRefs,
        }
    }
}
