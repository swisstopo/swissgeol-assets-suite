import {
  AssetFilters,
  AssetJSON,
  AssetSearchStats,
  AssetSearchUsageCode,
  ContactId,
  GeometryType,
  LocalDate,
  makeEmptyAssetSearchStats,
  SearchQuery,
  User,
  ValueCount,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { QueryDslQueryContainer, SearchResponse, SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';
import { WorkflowStatus } from '@swissgeol/ui-core';
import { SEARCH_BATCH_SIZE } from '@/features/assets/search/asset-search.constants';
import {
  createMakeAggregation,
  mapQueryToElasticDslParts,
  PageOptions,
} from '@/features/assets/search/search-query.utils';

export interface PaginatedSearchResult<EntityId extends number | string> {
  results: Map<EntityId, string>;
  total: number;
}

/**
 * The state of a multistep search.
 */
interface SearchState<EntityId extends number | string> {
  /**
   * The entities that match the search.
   * This is a mapping from the entities' id to their serialized JSON string.
   */
  matchedEntities: Map<EntityId, string>;

  /**
   * The id of the last entity that has been matched.
   * This is used to enable paginated search results with Elasticsearch.
   *
   * This is `null` if no query has been executed yet.
   */
  lastEntityId: EntityId | null;

  /**
   * The total number of entities, including the ones that were skipped due to offset and limit.
   *
   * This is `null` if no query has been executed yet.
   */
  totalCount: number | null;
}

export class SearchService<EntityId extends number | string> {
  constructor(
    private readonly index: string,
    private readonly elastic: ElasticsearchClient,
  ) {}

  /**
   * Searches the query and returns the matched entities in a paginated format.
   * @param query
   * @param page
   */
  public async search(query: QueryDslQueryContainer, page: PageOptions = {}): Promise<PaginatedSearchResult<EntityId>> {
    const state: SearchState<EntityId> = {
      matchedEntities: new Map<EntityId, string>(),
      lastEntityId: null,
      totalCount: null,
    };
    const hasOffset = await this.findOffsetForSearch(query, page, state);
    if (hasOffset) {
      await this.doSearchByOffset(query, page, state);
    }
    return { results: state.matchedEntities, total: state.totalCount ?? 0 };
  }

  /**
   * Aggregates the stats over all assets matching a specific SearchQuery.
   *
   * @param query The query to match with.
   * @param user The user that is executing the query.
   * @param makeAggregation
   * @param options
   * @param options.unrestrictedWorkgroupQuery If provided, the workgroup aggregation will use this
   *   query instead of the main query. This allows admins to see counts for all workgroups
   *   while other stats remain restricted to their assigned workgroups.
   */
  async aggregate<TQuery extends AssetFilters & SearchQuery>(
    query: TQuery,
    user: User,
    options?: { unrestrictedWorkgroupQuery?: TQuery },
  ): Promise<AssetSearchStats> {
    const { must, filter, aggs } = mapQueryToElasticDslParts(query, user);

    const totalHitsResponse = await this.elastic.search({
      index: this.index,
      size: 0,
      query: { bool: { must, filter } },
      track_total_hits: true,
      aggs,
    });
    const rawHitCount = (totalHitsResponse.hits.total as SearchTotalHits).value;
    // When a `distinct_assets` cardinality aggregation is present (e.g. file search),
    // use its value instead of the raw hit count, which counts individual pages rather than assets.
    const totalHits =
      (totalHitsResponse.aggregations?.['distinct_assets'] as { value: number } | undefined)?.value ?? rawHitCount;
    const isNotAdminEdgecase = options?.unrestrictedWorkgroupQuery === undefined;
    if (totalHits === 0 && isNotAdminEdgecase) {
      return makeEmptyAssetSearchStats();
    }

    const makeAggregation = createMakeAggregation(query, user);
    const aggregations = {
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
    };

    const aggResults = (
      await this.elastic.search({
        index: this.index,
        size: 0,
        query: { bool: { must } },
        track_total_hits: true, // TODO: necessary?
        aggregations,
        filter_path: ['aggregations.*.a.buckets.*', 'aggregations.*.a.value'],
      })
    ).aggregations as unknown as NestedAggResult<AssetAggResult>;

    return {
      total: totalHits,
      kindCodes: aggResults.kindCodes?.a?.buckets?.map(mapBucket) ?? [],
      authorIds: aggResults.authorIds?.a?.buckets?.map(mapBucket) ?? [],
      languageCodes: aggResults.languageCodes?.a?.buckets?.map(mapBucket) ?? [],
      geometryTypes: aggResults.geometryTypes?.a?.buckets?.map(mapBucket) ?? [],
      topicCodes: aggResults.topicCodes?.a?.buckets?.map(mapBucket) ?? [],
      usageCodes: aggResults.usageCodes?.a?.buckets?.map(mapBucket) ?? [],
      workgroupIds: aggResults.workgroupIds?.a?.buckets?.map(mapBucket) ?? [],
      createdAt:
        aggResults.minCreatedAt != null && aggResults.maxCreatedAt != null
          ? {
              min: LocalDate.fromDate(new Date(aggResults.minCreatedAt.a.value)),
              max: LocalDate.fromDate(new Date(aggResults.maxCreatedAt.a.value)),
            }
          : null,
      status: aggResults.status?.a?.buckets?.map(mapBucket) ?? [],
    };
  }

  /**
   * Find which entities need to be skipped when paginating with an offset.
   *
   * Elasticsearch only supports offset by id/cursor, but not by a fixed number.
   * This means that we need to execute search queries for all skipped entities as well.
   *
   * This method will update {@link state.totalCount} and {@link state.lastEntityId}.
   *
   * @param elasticQuery The query to search with.
   * @param page The page options.
   * @param state The state of the current search.
   * @return Whether there are any more entities after the offset.
   * @private
   */
  private async findOffsetForSearch(
    elasticQuery: QueryDslQueryContainer,
    page: PageOptions,
    state: SearchState<EntityId>,
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
      if (state.lastEntityId == null && state.totalCount != null && state.totalCount < offset) {
        return false;
      }
      if (response.hits.hits.length < remainingLimit) {
        return false;
      }
      remainingOffset -= response.hits.hits.length;
      state.lastEntityId = response.hits.hits[response.hits.hits.length - 1].fields?.['id'][0] as EntityId;
    }
    return state.totalCount == null || state.totalCount > offset;
  }

  /**
   * Execute a search for assets after a specific offset has already been determined via {@link findOffsetForSearch}.
   *
   * This method will update {@link state.totalCount}, {@link state.lastAssetId} and {@link state.matchedAssets}.
   *
   * @param elasticQuery The query to search with.
   * @param page The page options.
   * @param state The state of the current search.
   * @private
   */
  private async doSearchByOffset(
    elasticQuery: QueryDslQueryContainer,
    page: PageOptions,
    state: SearchState<EntityId>,
  ) {
    for (;;) {
      const remainingLimit =
        page.limit == null ? SEARCH_BATCH_SIZE : Math.min(SEARCH_BATCH_SIZE, page.limit - state.matchedEntities.size);
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
        const id = hit.fields?.['id'][0] as EntityId;
        const data = hit.fields?.['data'][0] as AssetJSON;
        state.matchedEntities.set(id, data);
        state.lastEntityId = id;
      }
      if (state.totalCount != null && state.totalCount <= (page.offset ?? 0) + state.matchedEntities.size) {
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
    state: SearchState<EntityId>,
    options: { limit: number; fields: string[] },
  ): Promise<SearchResponse> {
    const response = await this.elastic.search({
      index: this.index,
      query: elasticQuery,
      size: options.limit,
      fields: options.fields,
      sort: {
        id: 'desc',
      },
      _source: false,
      track_total_hits: state.totalCount == null,
      search_after: state.lastEntityId == null ? undefined : [state.lastEntityId],
    });
    state.totalCount ??= (response.hits.total as SearchTotalHits).value as number;
    return response;
  }
}

const mapBucket = <T>(bucket: AggregationBucket<T>): ValueCount<T> => ({
  value: bucket.key,
  count: bucket.distinct_assets?.value ?? bucket.doc_count,
});

interface AssetAggResult {
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

type NestedAggResult<T> = {
  [K in keyof T]: {
    a: T[K];
  };
};

interface AggregationBucket<K = string> {
  key: K;
  doc_count: number;
  distinct_assets?: { value: number };
}
