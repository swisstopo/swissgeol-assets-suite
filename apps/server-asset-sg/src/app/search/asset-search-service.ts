/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import {
  BulkOperationContainer,
  QueryDslNumberRangeQuery,
  QueryDslQueryContainer,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  AssetByTitle,
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchStats,
  DateId,
  ElasticSearchAsset,
  SearchAssetAggregations,
  SearchAssetResult,
  UsageCode,
  ValueCount,
  dateFromDateId,
  dateIdFromDate,
  makeUsageCode,
} from '@asset-sg/shared';

import indexMapping from '../../../../../development/init/elasticsearch/mappings/swissgeol_asset_asset.json';
import { AssetEditDetail } from '../asset-edit/asset-edit.service';
import { AssetEditDetailFromPostgres } from '../models/asset-edit-detail';
import { PrismaService } from '../prisma/prisma.service';
import { AssetRepo } from '../repos/asset.repo';

const INDEX = 'swissgeol_asset_asset';
export { INDEX as ASSET_ELASTIC_INDEX };

interface SearchOptions {
  scope: Array<keyof ElasticSearchAsset>;
  assetIds?: number[];
}

interface ElasticSearchResult {
  scoresByAssetId: Map<number, number>;
  aggs: SearchAssetAggregations;
}

@Injectable()
export class AssetSearchService {
  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaService,
    private readonly assetRepo: AssetRepo,
  ) {
  }

  register(oneOrMore: AssetEditDetail | AssetEditDetail[]): Promise<void> {
    return this.registerWithOptions(oneOrMore, { index: INDEX, shouldRefresh: true });
  }

  async syncWithDatabase(onProgress?: (percentage: number) => (void | Promise<void>)): Promise<void> {
    // Write all Prisma assets into the sync index.
    const total = await this.prisma.asset.count();
    if (total === 0) {
      if (onProgress != null) {
        onProgress(1);
      }
      return
    }

    // Initialize a temporary sync index.
    const SYNC_INDEX = `sync-${INDEX}-${getDateTimeString()}`;
    const existsSyncIndex = await this.elastic.indices.exists({ index: SYNC_INDEX });
    if (existsSyncIndex) {
      throw new Error(`can't sync to '${SYNC_INDEX}', index already exists`);
    }

    await this.elastic.indices.create({ index: SYNC_INDEX });
    await this.elastic.indices.putMapping({
      index: SYNC_INDEX,
      ...indexMapping,
    });

    let offset = 0;
    for (; ;) {
      const records = await this.assetRepo.list({ limit: 1000, offset });
      if (records.length === 0) {
        break;
      }
      await this.registerWithOptions(records, { index: SYNC_INDEX });
      offset += records.length;
      if (onProgress != null) {
        await onProgress(Math.min(offset / total, 1));
      }
    }

    // Delete the existing asset index.
    await this.elastic.indices.delete({ index: INDEX });

    // Recreate the asset index and configure its mapping.
    await this.elastic.indices.create({ index: INDEX });
    await this.elastic.indices.putMapping({
      index: INDEX,
      ...indexMapping,
    });

    // Copy the sync index's contents into the empty asset index.
    await this.elastic.reindex({
      source: { index: SYNC_INDEX },
      dest: { index: INDEX },
    });

    // Refresh the asset index so its contents are searchable.
    await this.elastic.indices.refresh({ index: INDEX });

    // Delete the sync index.
    await this.elastic.indices.delete({ index: SYNC_INDEX });
  }

  private async registerWithOptions(
    oneOrMore: AssetEditDetail | AssetEditDetail[],
    { index, shouldRefresh = false }: { index: string, shouldRefresh?: boolean },
  ): Promise<void> {
    const assets = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
    const elasticAssets = await Promise.all(assets.map((asset) => this.mapAssetToElastic(asset)));
    const operations = elasticAssets.reduce((ops, elasticAsset) => {
      ops.push(
        { index: { _index: index, _id: `${elasticAsset.assetId}` } },
        elasticAsset,
      );
      return ops;
    }, [] as Array<BulkOperationContainer | ElasticSearchAsset>);
    await this.elastic.bulk({
      index,
      refresh: shouldRefresh,
      operations,
    });
  }

  async searchOld(query: string, options: SearchOptions): Promise<SearchAssetResult> {
    const elasticResult = await this.searchElasticOld(query, options);
    return await this.loadAssetsByElasticResult(elasticResult);
  }

  async search(query: AssetSearchQuery, { limit = 100, offset = 0 }: PageOptions = {}): Promise<AssetSearchResult> {
    const queriedAssetIds = await this.searchAssetIdsByQuery(query);
    const ids = await this.filterAssetIdsByPolygon(query, queriedAssetIds);
    const [data, stats] = await Promise.all([
      this.assetRepo.list({ ids, limit, offset }),
      this.aggregateAssetIds(ids),
    ]);
    return {
      page: {
        offset,
        size: data.length,
        total: ids.length,
      },
      data,
      stats,
    };
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

  private async searchAssetIdsByQuery(query: AssetSearchQuery): Promise<number[]> {
    const elasticQuery = mapQueryToElasticDsl(query);
    const matchedAssetIds: number[] = [];
    for (; ;) {
      const response = await this.elastic.search({
        index: INDEX,
        query: elasticQuery,
        fields: ['assetId'],
        sort: {
          assetId: 'desc',
        },
        _source: false,
        search_after: matchedAssetIds.length === 0
          ? undefined
          : [matchedAssetIds[matchedAssetIds.length - 1]] as number[],
      });
      matchedAssetIds.push(...response.hits.hits.map((hit) => hit.fields!['assetId'][0]));
      const totalHits = (response.hits.total as SearchTotalHits).value;
      if (totalHits <= matchedAssetIds.length) {
        return matchedAssetIds;
      }
    }
  }

  private async filterAssetIdsByPolygon(query: AssetSearchQuery, assetIds: number[]): Promise<number[]> {
    if (assetIds.length === 0) {
      return [];
    }
    const conditions: Prisma.Sql[] = [
      Prisma.sql`a.asset_id IN (${Prisma.join(assetIds, ',')})`,
    ];
    if (query.polygon != null && query.polygon.length !== 0) {
      const sqlPolygonParams = query.polygon.map(({ x, y }) => `${y} ${x}`).join(',');
      const sqlPolygon = `polygon((${sqlPolygonParams}))`;
      conditions.push(Prisma.sql`
          ST_CONTAINS(
            ST_GEOMFROMTEXT(${sqlPolygon}, 2056),
            ST_CENTROID(s.geom)
          )
        `);
    }

    // TODO Copy `geomCodes` into Elasticsearch so we only have to round-trip
    //      to Postgres if we have to do a polygon search.
    if (query.geomCodes != null) {
      const geomCodeConditions: Prisma.Sql[] = [];
      for (const geomCode of query.geomCodes) {
        const condition = geomCode === 'None'
          ? Prisma.sql`s.id IS NULL`
          : Prisma.sql`STARTS_WITH(s.geom_text, ${geomCode.toUpperCase()})`;
        geomCodeConditions.push(condition);
      }
      conditions.push(Prisma.join(geomCodeConditions, ' OR '));
    }

    const matchedAssets = await this.prisma.$queryRaw<Array<{ assetId: number }>>`
          SELECT DISTINCT
            a.asset_id as "assetId"
          FROM
            public.asset a
          LEFT JOIN
            public.all_study s
          ON
            s.asset_id = a.asset_id
          WHERE
            ${Prisma.join(conditions, ' AND ')}
        `;
    return matchedAssets.map((it) => it.assetId);
  }

  private async aggregateAssetIds(assetIds: number[]): Promise<AssetSearchStats | null> {
    if (assetIds.length === 0) {
      return null;
    }

    interface Result {
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

    const response = await this.elastic.search({
      index: INDEX,
      size: 0,
      query: {
        terms: {
          assetId: assetIds,
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
    });

    const { aggregations: aggs } = response as unknown as Result;
    const mapBucket = <T>(bucket: AggregationBucket<T>): ValueCount<T> => ({
      value: bucket.key,
      count: bucket.doc_count,
    });
    return {
      assetKindItemCodes: aggs.assetKindItemCodes.buckets.map(mapBucket),
      authorIds: aggs.authorIds.buckets.map(mapBucket),
      languageItemCodes: aggs.languageItemCodes.buckets.map(mapBucket),
      manCatLabelItemCodes: aggs.manCatLabelItemCodes.buckets.map(mapBucket),
      usageCodes: aggs.usageCodes.buckets.map(mapBucket),
      createDate: {
        min: dateFromDateId(aggs.minCreateDate.value),
        max: dateFromDateId(aggs.maxCreateDate.value),
      },
    };
  }

  private async searchElasticOld(
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
        languageItemCodes: { terms: { field: 'languageItemCode' } },
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
      return { _tag: 'SearchAssetResultEmpty' };
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
    });
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
      contactNames: contacts.map((it) => it.name),
      manCatLabelItemCodes: asset.manCatLabelRefs,
    };
  }
}

const mapQueryToElasticDsl = (query: AssetSearchQuery): QueryDslQueryContainer => {
  const scope = ['titlePublic', 'titleOriginal', 'contactNames', 'sgsId'];
  const queries: QueryDslQueryContainer[] = [];
  const filters: QueryDslQueryContainer[] = [];
  if (query.text != null && query.text.length > 0) {
    queries.push({
      bool: {
        should: [
          {
            multi_match: {
              query: query.text,
              fields: scope,
              fuzziness: 'AUTO',
            },
          },
          {
            query_string: {
              query: `*${query.text}*`,
              fields: scope,
            },
          },
        ],
      },
    });
  }
  if (query.authorId != null) {
    filters.push({
      term: {
        authorIds: query.authorId,
      },
    });
  }
  if (query.createDate != null && Object.keys(query.createDate).length > 0) {
    const createDateFilter: QueryDslNumberRangeQuery = {};
    if (query.createDate.min != null) {
      createDateFilter.gte = dateIdFromDate(query.createDate.min);
    }
    if (query.createDate.max != null) {
      createDateFilter.lte = dateIdFromDate(query.createDate.max);
    }
    filters.push({
      range: {
        createDate: createDateFilter,
      },
    });
  }
  if (query.manCatLabelItemCodes != null) {
    filters.push(makeArrayQuery('manCatLabelItemCodes', query.manCatLabelItemCodes));
  }
  if (query.assetKindItemCodes != null) {
    filters.push(makeArrayQuery('assetKindItemCode', query.assetKindItemCodes));
  }
  if (query.usageCodes != null) {
    filters.push(makeArrayQuery('usageCode', query.usageCodes));
  }
  if (query.languageItemCodes != null) {
    filters.push(makeArrayQuery('languageItemCode', query.languageItemCodes));
  }

  return {
    bool: {
      must: queries,
      filter: filters,
    },
  };
};

const makeArrayQuery = <T extends number | string>(
  field: keyof ElasticSearchAsset | `${keyof ElasticSearchAsset}.keyword`,
  query: T[],
): QueryDslQueryContainer => {
  if (query.length === 0) {
    return { bool: { must_not: { exists: { field } } } };
  }
  return {
    bool: {
      should: query.map((term) => ({ term: { [field]: term } })),
    },
  };
};

const getDateTimeString = (): string => {
  const now = new Date();
  const padZero = (value: number): string | number => {
    if (value >= 10) {
      return value
    }
    return `0${value}`
  }
  return ''
    + now.getUTCFullYear()
    + padZero(now.getUTCMonth())
    + padZero(now.getUTCDate())
    + padZero(now.getUTCHours())
    + padZero(now.getUTCMinutes())
    + padZero(now.getUTCSeconds())
}

interface PageOptions {
  limit?: number;
  offset?: number;
}
