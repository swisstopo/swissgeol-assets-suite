/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AssetByTitle,
  AssetEditDetail,
  AssetSearchQuery,
  AssetSearchStats,
  dateFromDateId,
  DateId,
  dateIdFromDate,
  ElasticSearchAsset,
  GeometryCode,
  makeUsageCode,
  SearchAssetAggregations,
  SearchAssetResult,
  SerializedAssetEditDetail,
  UsageCode,
  ValueCount,
} from '@asset-sg/shared';
import {
  AssetId,
  AssetSearchResult,
  AssetSearchResultItem,
  AssetSearchResultItemStudy,
  User,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import {
  AggregationsAggregationContainer,
  QueryDslNumberRangeQuery,
  QueryDslQueryContainer,
  SearchResponse,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { Injectable, Logger } from '@nestjs/common';

// eslint-disable-next-line @nx/enforce-module-boundaries
import indexMapping from '../../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_asset.json';

import { PrismaService } from '@/core/prisma.service';
import { AssetEditRepo } from '@/features/assets/asset-edit/asset-edit.repo';
import { mapLv95ToElastic } from '@/features/assets/assets/search/asset-search.utils';
import { AssetSearchWriter, AssetSearchWriterOptions } from '@/features/assets/assets/search/asset-search.writer';
import { StudyRepo } from '@/features/studies/study.repo';

const INDEX = 'swissgeol_asset_asset';
export { INDEX as ASSET_ELASTIC_INDEX };

interface SearchOptions {
  scope: Array<keyof ElasticSearchAsset>;
  assetIds?: AssetId[];
}

interface ElasticSearchResult {
  scoresByAssetId: Map<AssetId, number>;
  aggs: SearchAssetAggregations;
}

const SEARCH_BATCH_SIZE = 10_000;

@Injectable()
export class AssetSearchService {
  private readonly logger = new Logger(AssetSearchService.name);

  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaService,
    private readonly assetRepo: AssetEditRepo,
    private readonly studyRepo: StudyRepo,
  ) {}

  register(asset: AssetEditDetail): Promise<void> {
    return this.getWriter().write(asset);
  }

  getWriter(options?: AssetSearchWriterOptions): AssetSearchWriter {
    return new AssetSearchWriter(
      this.elastic,
      this.prisma,
      this.studyRepo,
      options ?? { index: INDEX, shouldRefresh: true },
    );
  }

  async deleteFromIndex(assetId: number): Promise<void> {
    await this.elastic.delete({
      index: INDEX,
      id: `${assetId}`,
      refresh: true,
    });
  }

  async count(): Promise<number> {
    return (await this.elastic.count({ index: INDEX, ignore_unavailable: true })).count;
  }

  async syncWithDatabase(onProgress?: (percentage: number) => void | Promise<void>): Promise<void> {
    // Write all Prisma assets into the sync index.
    const total = await this.prisma.asset.count();
    if (total === 0) {
      this.logger.debug('No assets to sync');
      if (onProgress != null) {
        onProgress(1);
      }
      return;
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

    const writer = this.getWriter({ index: SYNC_INDEX, isEager: true });
    let offset = 0;
    for (;;) {
      this.logger.debug('Syncing assets.', {
        total,
        offset,
        progress: Number((offset / total).toFixed(2)),
      });
      const records = await this.assetRepo.list({ limit: 1000, offset });
      if (records.length === 0) {
        break;
      }
      await writer.write(records);
      offset += records.length;
      if (onProgress != null) {
        await onProgress(Math.min(offset / total, 1));
      }
    }
    this.logger.debug('Done syncing assets.', { total });

    // Delete the existing asset index.
    await this.elastic.indices.delete({ index: INDEX, ignore_unavailable: true });

    // Recreate the asset index and configure its mapping.
    await this.elastic.indices.create({ index: INDEX });
    await this.elastic.indices.putMapping({
      index: INDEX,
      ...indexMapping,
    });

    // Refresh the sync index, so we can reindex its contents.
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

  /**
   * @deprecated Part of the old search API. Will be removed when the new API goes live.
   */
  async searchOld(query: string, options: SearchOptions): Promise<SearchAssetResult> {
    const elasticResult = await this.searchElasticOld(query, options);
    return await this.loadAssetsByElasticResult(elasticResult);
  }

  /**
   * Searches for assets using a {@link AssetSearchQuery}.
   *
   * @param query The query to match with.
   * @param user The user that is executing the query.
   * @param limit The maximum amount of assets to load. Defaults to `100`.
   * @param offset The amount of assets being skipped before loading the assets.
   * @param decode Whether to decode the assets. If this is set to `false`, the assets should be decoded via
   *   `AssetEditDetail` before accessing them. This option primarily exists so that the assets are not decoded and
   *   directly re-encoded when returning them via API.
   */
  async search(
    query: AssetSearchQuery,
    user: User,
    { limit = 100, offset = 0, decode = true }: PageOptions & { decode?: boolean } = {},
  ): Promise<AssetSearchResult> {
    // Apply the query to find all matching ids.
    const [serializedAssets, total] = await this.searchAssetsByQuery(query, user, { limit, offset });

    // Load the matched assets from the database.
    const data: AssetSearchResultItem[] = [];
    for (const serializedAsset of serializedAssets.values()) {
      const parsedAsset = this.parseSerializedAsset(serializedAsset);
      data.push(parsedAsset);
    }

    // Return the matched data in a paginated format.
    return {
      page: {
        offset,
        size: data.length,
        total,
      },
      data,
    };
  }

  /**
   * Aggregates the stats over all assets matching a specific {@link AssetSearchQuery}.
   *
   * @param query The query to match with.
   * @param user The user that is executing the query.
   */
  async aggregate(query: AssetSearchQuery, user: User): Promise<AssetSearchStats> {
    type NestedAggResult<T> = {
      [K in keyof T]: {
        a: T[K];
      };
    };

    interface Result {
      minCreateDate: { value: DateId };
      maxCreateDate: { value: DateId };
      authorIds: {
        buckets: AggregationBucket<number>[];
      };
      assetKindItemCodes: {
        buckets: AggregationBucket[];
      };
      languageItemCodes: {
        buckets: AggregationBucket[];
      };
      geometryCodes: {
        buckets: AggregationBucket<GeometryCode | 'None'>[];
      };
      manCatLabelItemCodes: {
        buckets: AggregationBucket[];
      };
      usageCodes: {
        buckets: AggregationBucket<UsageCode>[];
      };
      workgroupIds: {
        buckets: AggregationBucket<number>[];
      };
    }

    interface AggregationBucket<K = string> {
      key: K;
      doc_count: number;
    }

    const makeAggregation = (
      operator: 'terms' | 'min' | 'max',
      groupName: string,
      fieldName?: string,
    ): AggregationsAggregationContainer => {
      const NUMBER_OF_BUCKETS = 10_000;
      const { filter } = mapQueryToElasticDslParts({ ...query, [groupName]: undefined }, user);
      const field: { field: string; size?: number } = { field: fieldName ?? groupName, size: NUMBER_OF_BUCKETS };
      if (operator !== 'terms') {
        delete field.size;
      }
      return { aggs: { a: { [operator]: field } }, filter: { bool: { filter } } };
    };

    const { must, filter } = mapQueryToElasticDslParts(query, user);

    const aggregateByQuery = async (aggs: Record<string, AggregationsAggregationContainer>) => {
      return await this.elastic.search({
        index: INDEX,
        size: 0,
        query: { bool: { must } },
        track_total_hits: true,
        aggregations: aggs,
        filter_path: ['aggregations.*.a.buckets.*', 'aggregations.*.a.value'],
      });
    };

    const response = await this.elastic.search({
      index: INDEX,
      size: 0,
      query: { bool: { must, filter } },
      track_total_hits: true,
    });
    const total = (response.hits.total as SearchTotalHits).value;
    if (total === 0) {
      return {
        total: 0,
        assetKindItemCodes: [],
        authorIds: [],
        createDate: null,
        languageItemCodes: [],
        geometryCodes: [],
        manCatLabelItemCodes: [],
        usageCodes: [],
        workgroupIds: [],
      };
    }

    const result = await aggregateByQuery({
      assetKindItemCodes: makeAggregation('terms', 'assetKindItemCodes', 'assetKindItemCode'),
      authorIds: makeAggregation('terms', 'authorIds'),
      languageItemCodes: makeAggregation('terms', 'languageItemCodes'),
      geometryCodes: makeAggregation('terms', 'geometryCodes'),
      manCatLabelItemCodes: makeAggregation('terms', 'manCatLabelItemCodes'),
      usageCodes: makeAggregation('terms', 'usageCodes', 'usageCode'),
      workgroupIds: makeAggregation('terms', 'workgroupIds', 'workgroupId'),
      minCreateDate: makeAggregation('min', 'minCreateDate', 'createDate'),
      maxCreateDate: makeAggregation('max', 'maxCreateDate', 'createDate'),
    });

    const aggs = result.aggregations as unknown as NestedAggResult<Result>;

    const mapBucket = <T>(bucket: AggregationBucket<T>): ValueCount<T> => ({
      value: bucket.key,
      count: bucket.doc_count,
    });
    return {
      total,
      assetKindItemCodes: aggs.assetKindItemCodes?.a?.buckets?.map(mapBucket) ?? [],
      authorIds: aggs.authorIds?.a?.buckets?.map(mapBucket) ?? [],
      languageItemCodes: aggs.languageItemCodes?.a?.buckets?.map(mapBucket) ?? [],
      geometryCodes: aggs.geometryCodes?.a?.buckets?.map(mapBucket) ?? [],
      manCatLabelItemCodes: aggs.manCatLabelItemCodes?.a?.buckets?.map(mapBucket) ?? [],
      usageCodes: aggs.usageCodes?.a?.buckets?.map(mapBucket) ?? [],
      workgroupIds: aggs.workgroupIds?.a?.buckets?.map(mapBucket) ?? [],
      createDate: {
        min: dateFromDateId(aggs.minCreateDate.a.value),
        max: dateFromDateId(aggs.maxCreateDate.a.value),
      },
    };
  }

  /**
   * @deprecated Part of the old search API. Will be removed when the new API goes live.
   */
  async searchByTitle(title: string): Promise<AssetByTitle[]> {
    interface SearchHit {
      _score: number;
      fields: {
        assetId: [number];
        titlePublic: [string];
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

  private async searchAssetsByQuery(
    query: AssetSearchQuery,
    user: User,
    page: PageOptions = {},
  ): Promise<[Map<AssetId, SerializedAssetEditDetail>, number]> {
    const elasticQuery = mapQueryToElasticDsl(query, user);

    const state: SearchState = {
      matchedAssets: new Map(),
      lastAssetId: null,
      totalCount: null,
    };
    const hasMore = await this.doOffsetForSearch(elasticQuery, page, state);
    if (hasMore) {
      await this.doSearchByOffset(elasticQuery, page, state);
    }
    return [state.matchedAssets, state.totalCount ?? 0];
  }

  /**
   * Find which assets need to be skipped when paginating with an offset.
   *
   * Elasticsearch only supports offset by id/cursor, but not by a fixed number.
   * This means that we need to execute search queries for all skipped assets as well.
   *
   * This method will update {@link state.totalCount} and {@link state.lastAssetId}.
   *
   * @param elasticQuery The query to search with.
   * @param page The page options.
   * @param state The state of the current search.
   * @return Whether there are any more assets after the offset.
   * @private
   */
  private async doOffsetForSearch(
    elasticQuery: QueryDslQueryContainer,
    page: PageOptions,
    state: SearchState,
  ): Promise<boolean> {
    const offset = page.offset ?? 0;
    let remainingOffset = offset;
    while (remainingOffset > 0) {
      const remainingLimit = Math.min(SEARCH_BATCH_SIZE, remainingOffset);
      if (remainingLimit <= 0) {
        break;
      }
      const response = await this.executeSearchQuery(elasticQuery, state, {
        limit: remainingLimit,
        fields: ['assetId'],
      });
      if (state.lastAssetId == null && state.totalCount != null && state.totalCount < offset) {
        return false;
      }
      if (response.hits.hits.length < remainingLimit) {
        return false;
      }
      remainingOffset -= response.hits.hits.length;
      state.lastAssetId = response.hits.hits[response.hits.hits.length - 1].fields!['assetId'][0] as number;
    }
    return state.totalCount == null || state.totalCount > offset;
  }

  /**
   * Execute a search for assets after a specific offset has already been determined via {@link doOffsetForSearch}.
   *
   * This method will update {@link state.totalCount}, {@link state.lastAssetId} and {@link state.matchedAssets}.
   *
   * @param elasticQuery The query to search with.
   * @param page The page options.
   * @param state The state of the current search.
   * @private
   */
  private async doSearchByOffset(elasticQuery: QueryDslQueryContainer, page: PageOptions, state: SearchState) {
    for (;;) {
      const remainingLimit =
        page.limit == null ? SEARCH_BATCH_SIZE : Math.min(SEARCH_BATCH_SIZE, page.limit - state.matchedAssets.size);
      if (remainingLimit <= 0 && state.totalCount != null) {
        return;
      }
      const response = await this.executeSearchQuery(elasticQuery, state, {
        limit: remainingLimit,
        fields: ['assetId', 'data'],
      });
      if (response.hits.hits.length === 0) {
        return;
      }
      for (const hit of response.hits.hits) {
        const assetId: number = hit.fields!['assetId'][0];
        const data = hit.fields!['data'][0];
        state.matchedAssets.set(assetId, data);
        state.lastAssetId = assetId;
      }
      if (state.totalCount != null && state.totalCount <= (page.offset ?? 0) + state.matchedAssets.size) {
        return;
      }
    }
  }

  /**
   * Execute an elastic query in the context of a @link SearchState}.
   *
   * This method will update {@link state.totalCount}.
   *
   * @param elasticQuery The query to execute.
   * @param state The search state.
   * @param options Describes how to execute the query.
   * @param options.limit How many documents will be queried at most.
   * @param options.fields The document fields that will be included in the response.
   * @returns The Elasticsearch response.
   * @private
   */
  private async executeSearchQuery(
    elasticQuery: QueryDslQueryContainer,
    state: SearchState,
    options: { limit: number; fields: string[] },
  ): Promise<SearchResponse> {
    const response = await this.elastic.search({
      index: INDEX,
      query: elasticQuery,
      size: options.limit,
      fields: options.fields,
      sort: {
        assetId: 'desc',
      },
      _source: false,
      track_total_hits: state.totalCount == null,
      search_after: state.lastAssetId == null ? undefined : [state.lastAssetId],
    });
    state.totalCount ??= (response.hits.total as SearchTotalHits).value as number;
    return response;
  }

  private async searchElasticOld(query: string, { scope, assetIds }: SearchOptions): Promise<ElasticSearchResult> {
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
          _score: number;
          fields: {
            assetId: [number];
          };
        }>;
      };
      aggregations: {
        minCreateDate: { value: DateId };
        maxCreateDate: { value: DateId };
        authorIds: {
          buckets: AggregationBucket<number>[];
        };
        assetKindItemCodes: {
          buckets: AggregationBucket[];
        };
        languageItemCodes: {
          buckets: AggregationBucket[];
        };
        usageCodes: {
          buckets: AggregationBucket<UsageCode>[];
        };
        manCatLabelItemCodes: {
          buckets: AggregationBucket[];
        };
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
        authorIds: aggs.authorIds.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
        assetKindItemCodes: aggs.assetKindItemCodes.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
        languageItemCodes: aggs.languageItemCodes.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
        usageCodes: aggs.usageCodes.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
        manCatLabelItemCodes: aggs.manCatLabelItemCodes.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
      },
    };

    return { scoresByAssetId, aggs: searchAggs };
  }

  private async loadAssetsByElasticResult({ scoresByAssetId, aggs }: ElasticSearchResult): Promise<SearchAssetResult> {
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

  private parseSerializedAsset(serializedAsset: SerializedAssetEditDetail): AssetSearchResultItem {
    const {
      assetContacts,
      assetId,
      createDate,
      titlePublic,
      studies,
      assetKindItemCode,
      assetFormatItemCode,
      manCatLabelRefs,
      publicUse,
      internalUse,
    } = JSON.parse(serializedAsset);

    return {
      assetContacts,
      assetId,
      createDate,
      titlePublic,
      studies: studies.map((study: AssetSearchResultItemStudy) => ({
        studyId: study.studyId,
        geomText: study.geomText,
      })),
      assetKindItemCode,
      assetFormatItemCode,
      manCatLabelRefs,
      publicUse: { isAvailable: publicUse.isAvailable },
      internalUse: { isAvailable: internalUse.isAvailable },
    };
  }
}

const mapQueryToElasticDsl = (query: AssetSearchQuery, user: User): QueryDslQueryContainer => {
  const { must, filter } = mapQueryToElasticDslParts(query, user);
  return {
    bool: {
      must,
      filter,
    },
  };
};

const mapQueryToElasticDslParts = (
  query: AssetSearchQuery,
  user: User,
): { must: QueryDslQueryContainer[]; filter: QueryDslQueryContainer[] } => {
  const scope = ['titlePublic', 'titleOriginal', 'contactNames', 'sgsId'];
  const queries: QueryDslQueryContainer[] = [];
  const filters: QueryDslQueryContainer[] = [];
  if (query.text != null && query.text.length > 0) {
    queries.push({
      bool: {
        should: [
          {
            query_string: {
              query: normalizeFieldQuery(query.text),
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
  if (query.geometryCodes != null) {
    filters.push(makeArrayFilter('geometryCodes', query.geometryCodes));
  }
  if (query.workgroupIds != null) {
    filters.push({
      terms: {
        workgroupId: query.workgroupIds,
      },
    });
  }
  if (query.favoritesOnly) {
    filters.push({
      terms: {
        favoredByUserIds: [user.id],
      },
    });
  }

  if (query.polygon != null) {
    queries.push({
      geo_polygon: {
        studyLocations: {
          points: query.polygon.map(mapLv95ToElastic),
        },
      },
    });
  }
  return {
    must: queries,
    filter: filters,
  };
};

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
      return value;
    }
    return `0${value}`;
  };
  return (
    '' +
    now.getUTCFullYear() +
    padZero(now.getUTCMonth()) +
    padZero(now.getUTCDate()) +
    padZero(now.getUTCHours()) +
    padZero(now.getUTCMinutes()) +
    padZero(now.getUTCSeconds())
  );
};

interface PageOptions {
  limit?: number;
  offset?: number;
}

const escapeElasticQuery = (query: string): string => {
  return query.replace(/(&&|\|\||!|\(|\)|\{|}|\[|]|\^|"|~|\*|\?|:|\\)/g, '\\$1');
};

const normalizeFieldQuery = (query: string): string =>
  query
    .replace(/title(_*)public:/gi, 'titlePublic:')
    .replace(/title(_*)original:/gi, 'titleOriginal:')
    .replace(/contact(_*)ame:/gi, 'contactNames:')
    .replace(/sgs(_*)id:/gi, 'sgsId:');

/**
 * The state of a multistep asset search.
 */
interface SearchState {
  /**
   * The assets that match the search.
   * This is a mapping from the assets' id to their serialized JSON string.
   */
  matchedAssets: Map<AssetId, SerializedAssetEditDetail>;

  /**
   * The id of the last asset that has been matched.
   * This is used to enable paginated search results with Elasticsearch.
   *
   * This is `null` if no query has been executed yet.
   */
  lastAssetId: number | null;

  /**
   * The total number of assets, including the ones that were skipped due to offset and limit.
   *
   * This is `null` if no query has been executed yet.
   */
  totalCount: number | null;
}
