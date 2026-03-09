import {
  AssetId,
  AssetJSON,
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchResultItem,
  AssetSearchResultItemSchema,
  AssetSearchStats,
  AssetSearchUsageCode,
  ContactId,
  GeometryType,
  LocalDate,
  User,
  ValueCount,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import {
  AggregationsAggregationContainer,
  QueryDslQueryContainer,
  SearchResponse,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { WorkflowStatus } from '@swissgeol/ui-core';
import { plainToInstance } from 'class-transformer';
import { ASSET_ELASTIC_INDEX, SEARCH_BATCH_SIZE } from '@/features/assets/search/asset-search.constants';
import {
  mapQueryToElasticDsl,
  mapQueryToElasticDslParts,
  PageOptions,
  SearchState,
} from '@/features/assets/search/asset-search.query';

// Re-export constants and helpers for backwards compatibility
export { ASSET_ELASTIC_INDEX, FILE_ELASTIC_INDEX } from '@/features/assets/search/asset-search.constants';
export { escapeElasticQuery, normalizeFieldQuery } from '@/features/assets/search/asset-search.query';

@Injectable()
export class AssetSearchService {
  constructor(private readonly elastic: ElasticsearchClient) {}

  /**
   * Searches for assets using a {@link AssetSearchQuery}.
   *
   * @param query The query to match with.
   * @param user The user that is executing the query.
   * @param limit The maximum amount of assets to load. Defaults to `100`.
   * @param offset The amount of assets being skipped before loading the assets.
   * @param decode Whether to decode the assets. If this is set to `false`, the assets should be decoded via
   *   `Asset` before accessing them. This option primarily exists so that the assets are not decoded and
   *   directly re-encoded when returning them via API.
   */
  async search(
    query: AssetSearchQuery,
    user: User,
    { limit = 100, offset = 0, decode: shouldDecode = true }: PageOptions & { decode?: boolean } = {},
  ): Promise<AssetSearchResult> {
    // Apply the query to find all matching ids.
    const [serializedAssets, total] = await this.searchAssetsByQuery(query, user, { limit, offset });

    // Load the matched assets from the database.
    const data: AssetSearchResultItem[] = [];
    for (const serializedAsset of serializedAssets.values()) {
      const encodedAsset = JSON.parse(serializedAsset);
      data.push(
        shouldDecode
          ? plainToInstance(AssetSearchResultItemSchema, encodedAsset, { excludeExtraneousValues: true })
          : encodedAsset,
      );
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
   * Count assets matching the query in the asset index.
   */
  async countAssetsByQuery(query: AssetSearchQuery, user: User): Promise<number> {
    const elasticQuery = mapQueryToElasticDsl(query, user);
    const response = await this.elastic.count({
      index: ASSET_ELASTIC_INDEX,
      query: elasticQuery,
      ignore_unavailable: true,
    });
    return response.count;
  }

  /**
   * Aggregates the stats over all assets matching a specific {@link AssetSearchQuery}.
   *
   * @param query The query to match with.
   * @param user The user that is executing the query.
   * @param options.unrestrictedWorkgroupQuery If provided, the workgroup aggregation will use this
   *   query instead of the main query. This allows admins to see counts for all workgroups
   *   while other stats remain restricted to their assigned workgroups.
   */
  async aggregate(
    query: AssetSearchQuery,
    user: User,
    options?: { unrestrictedWorkgroupQuery?: AssetSearchQuery },
  ): Promise<AssetSearchStats> {
    type NestedAggResult<T> = {
      [K in keyof T]: {
        a: T[K];
      };
    };

    interface Result {
      minCreatedAt: { value: number };
      maxCreatedAt: { value: number };
      authorIds: {
        buckets: AggregationBucket<ContactId>[];
      };
      kindCodes: {
        buckets: AggregationBucket[];
      };
      languageCodes: {
        buckets: AggregationBucket[];
      };
      geometryTypes: {
        buckets: AggregationBucket<GeometryType | 'None'>[];
      };
      topicCodes: {
        buckets: AggregationBucket[];
      };
      status: {
        buckets: AggregationBucket<WorkflowStatus>[];
      };
      usageCodes: {
        buckets: AggregationBucket<AssetSearchUsageCode>[];
      };
      workgroupIds: {
        buckets: AggregationBucket<WorkgroupId>[];
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
      queryOverride?: AssetSearchQuery,
    ): AggregationsAggregationContainer => {
      const NUMBER_OF_BUCKETS = 10_000;
      const baseQuery = queryOverride ?? query;
      const { filter } = mapQueryToElasticDslParts({ ...baseQuery, [groupName]: undefined }, user);
      const field: { field: string; size?: number } = { field: fieldName ?? groupName, size: NUMBER_OF_BUCKETS };
      if (operator !== 'terms') {
        delete field.size;
      }
      return { aggs: { a: { [operator]: field } }, filter: { bool: { filter } } };
    };

    const { must, filter } = mapQueryToElasticDslParts(query, user);

    const aggregateByQuery = async (aggs: Record<string, AggregationsAggregationContainer>) => {
      return await this.elastic.search({
        index: ASSET_ELASTIC_INDEX,
        size: 0,
        query: { bool: { must } },
        track_total_hits: true,
        aggregations: aggs,
        filter_path: ['aggregations.*.a.buckets.*', 'aggregations.*.a.value'],
      });
    };

    const response = await this.elastic.search({
      index: ASSET_ELASTIC_INDEX,
      size: 0,
      query: { bool: { must, filter } },
      track_total_hits: true,
    });
    const total = (response.hits.total as SearchTotalHits).value;
    if (total === 0 && options?.unrestrictedWorkgroupQuery === undefined) {
      return {
        total: 0,
        kindCodes: [],
        authorIds: [],
        createdAt: null,
        languageCodes: [],
        geometryTypes: [],
        topicCodes: [],
        usageCodes: [],
        workgroupIds: [],
        status: [],
      };
    }

    const result = await aggregateByQuery({
      authorIds: makeAggregation('terms', 'authorIds'),
      languageCodes: makeAggregation('terms', 'languageCodes'),
      geometryTypes: makeAggregation('terms', 'geometryTypes'),
      kindCodes: makeAggregation('terms', 'kindCodes', 'kindCode'),
      topicCodes: makeAggregation('terms', 'topicCodes'),
      usageCodes: makeAggregation('terms', 'usageCodes', 'usageCode'),
      workgroupIds: makeAggregation('terms', 'workgroupIds', 'workgroupId', options?.unrestrictedWorkgroupQuery),
      minCreatedAt: makeAggregation('min', 'minCreatedAt', 'createdAt'),
      maxCreatedAt: makeAggregation('max', 'maxCreatedAt', 'createdAt'),
      status: makeAggregation('terms', 'status', 'status'),
    });

    const aggs = result.aggregations as unknown as NestedAggResult<Result>;

    const mapBucket = <T>(bucket: AggregationBucket<T>): ValueCount<T> => ({
      value: bucket.key,
      count: bucket.doc_count,
    });

    return {
      total,
      kindCodes: aggs.kindCodes?.a?.buckets?.map(mapBucket) ?? [],
      authorIds: aggs.authorIds?.a?.buckets?.map(mapBucket) ?? [],
      languageCodes: aggs.languageCodes?.a?.buckets?.map(mapBucket) ?? [],
      geometryTypes: aggs.geometryTypes?.a?.buckets?.map(mapBucket) ?? [],
      topicCodes: aggs.topicCodes?.a?.buckets?.map(mapBucket) ?? [],
      usageCodes: aggs.usageCodes?.a?.buckets?.map(mapBucket) ?? [],
      workgroupIds: aggs.workgroupIds?.a?.buckets?.map(mapBucket) ?? [],
      createdAt:
        aggs.minCreatedAt != null && aggs.maxCreatedAt != null
          ? {
              min: LocalDate.fromDate(new Date(aggs.minCreatedAt.a.value)),
              max: LocalDate.fromDate(new Date(aggs.maxCreatedAt.a.value)),
            }
          : null,
      status: aggs.status?.a?.buckets?.map(mapBucket) ?? [],
    };
  }

  private async searchAssetsByQuery(
    query: AssetSearchQuery,
    user: User,
    page: PageOptions = {},
  ): Promise<[Map<AssetId, AssetJSON>, number]> {
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
        fields: ['id'],
      });
      if (state.lastAssetId == null && state.totalCount != null && state.totalCount < offset) {
        return false;
      }
      if (response.hits.hits.length < remainingLimit) {
        return false;
      }
      remainingOffset -= response.hits.hits.length;
      state.lastAssetId = response.hits.hits[response.hits.hits.length - 1].fields?.['id'][0] as number;
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
        fields: ['id', 'data'],
      });
      if (response.hits.hits.length === 0) {
        return;
      }
      for (const hit of response.hits.hits) {
        const assetId = hit.fields?.['id'][0] as number;
        const data = hit.fields?.['data'][0] as AssetJSON;
        state.matchedAssets.set(assetId, data);
        state.lastAssetId = assetId;
      }
      if (state.totalCount != null && state.totalCount <= (page.offset ?? 0) + state.matchedAssets.size) {
        return;
      }
    }
  }

  /**
   * Execute an elastic query in the context of a {@link SearchState}.
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
      index: ASSET_ELASTIC_INDEX,
      query: elasticQuery,
      size: options.limit,
      fields: options.fields,
      sort: {
        id: 'desc',
      },
      _source: false,
      track_total_hits: state.totalCount == null,
      search_after: state.lastAssetId == null ? undefined : [state.lastAssetId],
    });
    state.totalCount ??= (response.hits.total as SearchTotalHits).value as number;
    return response;
  }
}
