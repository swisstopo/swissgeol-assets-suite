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
  GeometryCode,
  Polygon,
  SearchAssetAggregations,
  SearchAssetResult,
  UsageCode,
  ValueCount,
  dateFromDateId, dateIdFromDate, makeUsageCode,
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

    // Refresh the sync index so we can reindex its contents.
    await this.elastic.indices.refresh({ index: SYNC_INDEX });

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

  /**
   * Searches for assets using a {@link AssetSearchQuery}.
   *
   * @param query The query to match with.
   * @param limit The maximum amount of assets to load. Defaults to `100`.
   * @param offset The amount of assets being skipped before loading the assets.
   */
  async search(query: AssetSearchQuery, { limit = 100, offset = 0 }: PageOptions = {}): Promise<AssetSearchResult> {
    // Apply the query to find all matching ids.
    const ids = await this.searchIds(query);

    // Load the matched assets from the database.
    const data = await this.assetRepo.list({ ids, limit, offset });

    // Return the matched data in a paginated format.
    return {
      page: {
        offset,
        size: data.length,
        total: ids.length,
      },
      data,
    };
  }

  /**
   * Aggregates the stats over all assets matching a specific {@link AssetSearchQuery}.
   *
   * @param query The query to match with.
   */
  async aggregate(query: AssetSearchQuery): Promise<AssetSearchStats> {
    const ids = await this.searchIds(query);
    const stats = await this.aggregateAssetIds(ids);
    if (stats !== null) {
      return stats
    }
    return {
      total: 0,
      assetKindItemCodes: [],
      authorIds: [],
      createDate: null,
      languageItemCodes: [],
      manCatLabelItemCodes: [],
      usageCodes: []
    }
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

  private async searchIds(query: AssetSearchQuery): Promise<number[]> {
    // Apply the query on Elasticsearch.
    const queriedAssetIds = await this.searchAssetIdsByQuery(query);

    // Polygon searches need to be applied on the database.
    // With no polygon being present, we can just use the ids returned by Elasticsearch.
    return query.polygon == null
      ? queriedAssetIds
      : await this.filterAssetIdsByPolygon(query.polygon, queriedAssetIds);
  }

  private async searchAssetIdsByQuery(query: AssetSearchQuery): Promise<number[]> {
    const elasticQuery = mapQueryToElasticDsl(query);
    const matchedAssetIds: number[] = [];
    for (; ;) {
      const response = await this.elastic.search({
        index: INDEX,
        query: elasticQuery,
        fields: ['assetId'],
        size: 1000,
        sort: {
          assetId: 'desc',
        },
        track_total_hits: true,
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

  private async filterAssetIdsByPolygon(polygon: Polygon, assetIds: number[]): Promise<number[]> {
    if (assetIds.length === 0) {
      return [];
    }
    if (polygon.length === 0) {
      return assetIds;
    }
    const conditions: Prisma.Sql[] = [
      Prisma.sql`a.asset_id IN (${Prisma.join(assetIds, ',')})`,
    ];

    const sqlPolygonParams = polygon.map(({ x, y }) => `${y} ${x}`).join(',');
    const sqlPolygon = `polygon((${sqlPolygonParams}))`;
    conditions.push(Prisma.sql`
        ST_CONTAINS(
          ST_GEOMFROMTEXT(${sqlPolygon}, 2056),
          ST_CENTROID(s.geom)
        )
    `);
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
      track_total_hits: true,
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

    const total = (response.hits.total as SearchTotalHits).value;
    const { aggregations: aggs } = response as unknown as Result;
    const mapBucket = <T>(bucket: AggregationBucket<T>): ValueCount<T> => ({
      value: bucket.key,
      count: bucket.doc_count,
    });
    return {
      total,
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
                query: `*${escapeElasticQuery(query)}*`,
                fields: scope,
              },
            },
            {
              query_string: {
                query: query,
                fields: scope,
              }
            }
          ],
          filter: filters,
        },
      },
      aggs: {
        authorIds: { terms: { field: 'authorIds' } },
        minCreateDate: { min: { field: 'createDate' } },
        maxCreateDate: { max: { field: 'createDate' } },
        assetKindItemCodes: { terms: { field: 'assetKindItemCode' } },
        languageItemCodes: { terms: { field: 'languageItemCodes' } },
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
        assetLanguages: true,
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
          languages: entity.assetLanguages.map((it) => ({ code: it.languageItemCode })),
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
    const geometryCodes = asset.studies.map((study) => study.geomText.split('(', 2)[0]).map((prefix) => {
      switch (prefix) {
        case 'POINT':
          return GeometryCode.Point;
        case 'POLYGON':
          return GeometryCode.Polygon;
        case 'LINESTRING':
          return GeometryCode.LineString;
        default:
          throw new Error(`unknown geomText prefix: ${prefix}`)
      }
    })
    return {
      assetId: asset.assetId,
      titlePublic: asset.titlePublic,
      titleOriginal: asset.titleOriginal,
      sgsId: asset.sgsId,
      createDate: asset.createDate,
      assetKindItemCode: asset.assetKindItemCode,
      languageItemCodes: asset.assetLanguages.map((it) => it.languageItemCode),
      usageCode: makeUsageCode(asset.publicUse.isAvailable, asset.internalUse.isAvailable),
      authorIds: asset.assetContacts.filter((it) => it.role === 'author').map((it) => it.contactId),
      contactNames: contacts.map((it) => it.name),
      manCatLabelItemCodes: asset.manCatLabelRefs,
      geometryCodes: [...new Set(geometryCodes)],
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
              query: `*${escapeElasticQuery(query.text)}*`,
              fields: scope,
            },
          },
          {
            query_string: {
              query: query.text,
              fields: scope,
            }
          }
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
    filters.push(makeArrayFilter('manCatLabelItemCodes', query.manCatLabelItemCodes));
  }
  if (query.assetKindItemCodes != null) {
    filters.push(makeArrayFilter('assetKindItemCode', query.assetKindItemCodes));
  }
  if (query.usageCodes != null) {
    filters.push(makeArrayFilter('usageCode', query.usageCodes));
  }
  if (query.languageItemCodes != null) {
    filters.push(makeArrayFilter('languageItemCodes', query.languageItemCodes));
  }
  if (query.geomCodes != null) {
    filters.push(makeArrayFilterOrNone('geometryCodes', query.geomCodes));
  }

  return {
    bool: {
      must: queries,
      filter: filters,
    },
  };
};

/**
 * Create an Elasticsearch filter using the same rules as {@link makeArrayFilter},
 * but also allows the pseudo-value `'None'`, which matches all documents
 * for which the specified field is missing.
 *
 * @param field The field to match.
 * @param query The set of allowed values, including `'None'`.
 */
const makeArrayFilterOrNone = <T extends string | number>(
  field: keyof ElasticSearchAsset,
  query: (T | 'None')[],
): QueryDslQueryContainer => {
  // Create the set of allowed values and remove 'None' from it.
  // This allows us to pass the query to `makeArrayFilter`.
  const terms = new Set(query);
  const isNoneAllowed = terms.delete('None');

  // The set of conditions of which one will have to match for the filter to be successful (OR).
  const conditions: QueryDslQueryContainer[] = []

  // If the query contains 'None', we allow documents which don't contain the specified field.
  if (isNoneAllowed) {
    conditions.push(makeArrayFilter(field, []));
  }

  // If there are other valid terms besides 'None',
  // or 'None' is not specified, then we also filter by the other terms.
  // Note that this means that an empty query is equal to a query containing only `'None'`.
  if (terms.size > 0 || !isNoneAllowed) {
    conditions.push(makeArrayFilter(field, [...terms] as T[]));
  }

  // If there is only one condition, then we don't need to nest it.
  if (conditions.length === 1) {
    return conditions[0];
  }

  // Join multiple conditions using OR.
  return { bool: { should: conditions }}
}

/**
 * Create an Elasticsearch filter that matches all documents which contain a specific field
 * that contains any of a given set of values (the _query_).
 *
 * When the query is empty, only documents for which the field does not exist are matched.
 * A field does also count as "not existing" when it is set to `null` or an empty array.
 *
 * @param field The field to match.
 * @param query The set of allowed values.
 */
const makeArrayFilter = <T extends string | number>(
  field: keyof ElasticSearchAsset,
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

const escapeElasticQuery = (query: string): string => {
  return query.replace(/(&&|\|\||!|\(|\)|\{|}|\[|]|\^|"|~|\*|\?|:|\\)/, '\\$1')
}
