import {
  AssetFilters,
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
import {
  QueryDslQueryContainer,
  SearchFieldCollapse,
  SearchRequest,
  SearchResponse,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { WorkflowStatus } from '@swissgeol/ui-core';
import { SEARCH_BATCH_SIZE } from '@/features/assets/search/asset-search.constants';
import {
  createMakeAggregation,
  mapQueryToElasticDslParts,
  PageOptions,
} from '@/features/assets/search/search-query.utils';

export interface SearchConfig {
  /** The document field used as entity ID and default sort field. Defaults to 'id'. */
  entityIdField?: string;
  /** Collapse results by a field for grouping (e.g., by fileId). Works with search_after pagination. */
  collapse?: {
    field: string;
    innerHits?: {
      name: string;
      size: number;
      sourceFields?: string[];
      highlight?: Record<string, object>;
      sort?: Record<string, string>[];
    };
  };
  /** Fields to retrieve from _source. */
  sourceFields?: string[];
  /** Stored fields to retrieve (e.g., ['id', 'data'] for asset search). */
  storedFields?: string[];
  /** Additional cardinality aggregations to compute alongside the search. */
  countAggs?: Record<string, { field: string }>;
}

export interface SearchHitData {
  fields?: Record<string, unknown[]>;
  source?: Record<string, unknown>;
  innerHits?: Record<
    string,
    {
      source: Record<string, unknown>;
      highlight?: Record<string, string[]>;
    }[]
  >;
}

export interface PaginatedSearchResult<EntityId extends number | string> {
  results: Map<EntityId, SearchHitData>;
  total: number;
  counts: Record<string, number>;
}

interface SearchState<EntityId extends number | string> {
  matchedEntities: Map<EntityId, SearchHitData>;
  lastEntityId: EntityId | null;
  totalCount: number | null;
  counts: Record<string, number>;
}

export class SearchService<EntityId extends number | string> {
  constructor(
    private readonly index: string,
    private readonly elastic: ElasticsearchClient,
  ) {}

  /**
   * Searches the query and returns the matched entities in a paginated format.
   * @param query The Elasticsearch query.
   * @param page Pagination options (offset, limit).
   * @param config Optional search configuration for controlling fields, sorting, and collapse.
   */
  public async search(
    query: QueryDslQueryContainer,
    page: PageOptions = {},
    config?: SearchConfig,
  ): Promise<PaginatedSearchResult<EntityId>> {
    const state: SearchState<EntityId> = {
      matchedEntities: new Map(),
      lastEntityId: null,
      totalCount: null,
      counts: {},
    };
    const hasOffset = await this.findOffsetForSearch(query, page, state, config);
    if (hasOffset) {
      await this.doSearchByOffset(query, page, state, config);
    }
    return { results: state.matchedEntities, total: state.totalCount ?? 0, counts: state.counts };
  }

  /**
   * Aggregates the stats over all assets matching a specific SearchQuery.
   *
   * @param query The query to match with.
   * @param user The user that is executing the query.
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
    const totalFiles =
      (totalHitsResponse.aggregations?.['distinct_files'] as { value: number } | undefined)?.value ?? 0;
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
    ).aggregations as NestedAggResult<AssetAggResult> | undefined;
    if (!aggResults) {
      return makeEmptyAssetSearchStats();
    }

    return {
      total: totalHits,
      totalFiles,
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

  private async findOffsetForSearch(
    elasticQuery: QueryDslQueryContainer,
    page: PageOptions,
    state: SearchState<EntityId>,
    config?: SearchConfig,
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
        fetchData: false,
        config,
      });
      if (state.lastEntityId == null && state.totalCount != null && state.totalCount < offset) {
        return false;
      }
      if (response.hits.hits.length < remainingLimit) {
        return false;
      }
      remainingOffset -= response.hits.hits.length;
      state.lastEntityId = response.hits.hits[response.hits.hits.length - 1].sort?.[0] as EntityId;
    }
    return state.totalCount == null || state.totalCount > offset;
  }

  private async doSearchByOffset(
    elasticQuery: QueryDslQueryContainer,
    page: PageOptions,
    state: SearchState<EntityId>,
    config?: SearchConfig,
  ) {
    while (true) {
      const remainingLimit =
        page.limit == null ? SEARCH_BATCH_SIZE : Math.min(SEARCH_BATCH_SIZE, page.limit - state.matchedEntities.size);
      if (remainingLimit <= 0 && state.totalCount != null) {
        return;
      }
      const response = await this.executeSearchQuery(elasticQuery, state, {
        limit: remainingLimit,
        fetchData: true,
        config,
      });
      if (response.hits.hits.length === 0) {
        return;
      }
      for (const hit of response.hits.hits) {
        const entityId = hit.sort?.[0] as EntityId;
        const hitData: SearchHitData = {};
        if (hit.fields) {
          hitData.fields = hit.fields as Record<string, unknown[]>;
        }
        if (hit._source) {
          hitData.source = hit._source as Record<string, unknown>;
        }
        if (hit.inner_hits) {
          hitData.innerHits = {};
          for (const [name, innerHitResult] of Object.entries(hit.inner_hits)) {
            hitData.innerHits[name] = innerHitResult.hits.hits.map((ih) => ({
              source: ih._source as Record<string, unknown>,
              highlight: ih.highlight as Record<string, string[]> | undefined,
            }));
          }
        }
        state.matchedEntities.set(entityId, hitData);
        state.lastEntityId = entityId;
      }
      if (state.totalCount != null && state.totalCount <= (page.offset ?? 0) + state.matchedEntities.size) {
        return;
      }
    }
  }

  /**
   * Execute an Elasticsearch query in the context of a {@link SearchState}.
   * Supports configurable sort field, field collapse, source/stored fields, and inner hits.
   */
  private async executeSearchQuery(
    elasticQuery: QueryDslQueryContainer,
    state: SearchState<EntityId>,
    options: { limit: number; fetchData: boolean; config?: SearchConfig },
  ): Promise<SearchResponse> {
    const entityIdField = options.config?.entityIdField ?? 'id';

    const searchParams: SearchRequest = {
      index: this.index,
      query: elasticQuery,
      size: options.limit,
      sort: { [entityIdField]: 'desc' },
      _source: false as boolean | string[],
      track_total_hits: state.totalCount == null,
    };

    if (state.lastEntityId != null) {
      searchParams['search_after'] = [state.lastEntityId];
    }

    // Collapse configuration for grouping results (e.g., pages by fileId).
    if (options.config?.collapse) {
      const collapseParam: SearchFieldCollapse = {
        field: options.config.collapse.field,
      };
      if (options.fetchData && options.config.collapse.innerHits) {
        const ih = options.config.collapse.innerHits;
        collapseParam['inner_hits'] = {
          name: ih.name,
          size: ih.size,
          _source: ih.sourceFields ?? true,
          ...(ih.highlight ? { highlight: { fields: ih.highlight, highlight_query: elasticQuery } } : {}),
          ...(ih.sort ? { sort: ih.sort } : {}),
        };
      }
      searchParams['collapse'] = collapseParam;
    }

    // Add cardinality aggregations on the first query for accurate counts.
    if (state.totalCount == null) {
      const aggs: Record<string, Record<string, { field: string }>> = {};
      if (options.config?.collapse) {
        aggs['total_collapsed'] = { cardinality: { field: options.config.collapse.field } };
      }
      if (options.config?.countAggs) {
        for (const [name, { field }] of Object.entries(options.config.countAggs)) {
          aggs[name] = { cardinality: { field } };
        }
      }
      if (Object.keys(aggs).length > 0) {
        searchParams['aggs'] = aggs;
      }
    }

    // Include data fields only when fetching results (not during offset-finding).
    if (options.fetchData) {
      if (options.config?.storedFields) {
        searchParams['fields'] = options.config.storedFields;
      }
      if (options.config?.sourceFields) {
        searchParams['_source'] = options.config.sourceFields;
      }
    }

    const response = await this.elastic.search(searchParams);

    if (state.totalCount == null) {
      if (options.config?.collapse) {
        state.totalCount =
          (response.aggregations?.['total_collapsed'] as { value: number } | undefined)?.value ??
          (response.hits.total as SearchTotalHits).value;
      } else {
        state.totalCount = (response.hits.total as SearchTotalHits).value;
      }
      if (options.config?.countAggs && response.aggregations) {
        for (const name of Object.keys(options.config.countAggs)) {
          state.counts[name] = (response.aggregations[name] as { value: number } | undefined)?.value ?? 0;
        }
      }
    }

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
