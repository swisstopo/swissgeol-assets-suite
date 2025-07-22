/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Asset,
  AssetId,
  AssetJSON,
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchResultItem,
  AssetSearchResultItemSchema,
  AssetSearchStats,
  AssetSearchUsageCode,
  ContactId,
  ElasticsearchAsset,
  GeometryType,
  LocalDate,
  User,
  ValueCount,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import {
  AggregationsAggregationContainer,
  QueryDslDateRangeQuery,
  QueryDslQueryContainer,
  SearchResponse,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { Injectable, Logger } from '@nestjs/common';

import { plainToInstance } from 'class-transformer';

// eslint-disable-next-line @nx/enforce-module-boundaries
import indexMapping from '../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_asset.json';

import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { mapLv95ToElastic } from '@/features/assets/search/asset-search.utils';
import { AssetSearchWriter, AssetSearchWriterOptions } from '@/features/assets/search/asset-search.writer';
import { GeometryDetailRepo } from '@/features/geometries/geometry-detail.repo';
import { GeometryRepo } from '@/features/geometries/geometry.repo';

const INDEX = 'swissgeol_asset_asset';
export { INDEX as ASSET_ELASTIC_INDEX };

const SEARCH_BATCH_SIZE = 10_000;

@Injectable()
export class AssetSearchService {
  private readonly logger = new Logger(AssetSearchService.name);

  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaService,
    private readonly assetRepo: AssetRepo,
    private readonly geometryRepo: GeometryRepo,
    private readonly geometryDetailRepo: GeometryDetailRepo,
  ) {}

  register(asset: Asset): Promise<void> {
    return this.getWriter().write(asset);
  }

  getWriter(options?: AssetSearchWriterOptions): AssetSearchWriter {
    return new AssetSearchWriter(
      this.elastic,
      this.prisma,
      this.geometryRepo,
      this.geometryDetailRepo,
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
   * Returns just the IDs for all the queries, without pagination or limits.
   * To be used if we want to select data form the DB using WHERE IN or unnest()
   * @param query
   * @param user
   * @param shouldDecode
   */
  async searchIds(
    query: AssetSearchQuery,
    user: User,
    { decode: shouldDecode = true }: PageOptions & { decode?: boolean } = {},
  ): Promise<number[]> {
    // Apply the query to find all matching ids.
    const [serializedAssets, total] = await this.searchAssetsByQuery(query, user);

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
    this.logger.log(`Total Assets matching filters: ${data.length}`);
    this.logger.log(`Total Assets without geometries: ${data.filter((f) => f.geometries.length === 0).length}`);
    this.logger.log(
      `Total assets expected in geometry selection: ${data.filter((f) => f.geometries.length > 0).length}`,
    );
    return data.map((a) => a.id);
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
        kindCodes: [],
        authorIds: [],
        createdAt: null,
        languageCodes: [],
        geometryTypes: [],
        topicCodes: [],
        usageCodes: [],
        workgroupIds: [],
      };
    }

    const result = await aggregateByQuery({
      authorIds: makeAggregation('terms', 'authorIds'),
      languageCodes: makeAggregation('terms', 'languageCodes'),
      geometryTypes: makeAggregation('terms', 'geometryTypes'),
      kindCodes: makeAggregation('terms', 'kindCodes', 'kindCode'),
      topicCodes: makeAggregation('terms', 'topicCodes'),
      usageCodes: makeAggregation('terms', 'usageCodes', 'usageCode'),
      workgroupIds: makeAggregation('terms', 'workgroupIds', 'workgroupId'),
      minCreatedAt: makeAggregation('min', 'minCreatedAt', 'createdAt'),
      maxCreatedAt: makeAggregation('max', 'maxCreatedAt', 'createdAt'),
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
      createdAt: {
        min: LocalDate.fromDate(new Date(aggs.minCreatedAt.a.value)),
        max: LocalDate.fromDate(new Date(aggs.maxCreatedAt.a.value)),
      },
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
      state.lastAssetId = response.hits.hits[response.hits.hits.length - 1].fields!['id'][0] as number;
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
        const assetId: number = hit.fields!['id'][0];
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
  const scope = ['title', 'originalTitle', 'contactNames', 'sgsId'];
  const queries: QueryDslQueryContainer[] = [];
  const filters: QueryDslQueryContainer[] = [];
  if (query.text != null && query.text.length > 0) {
    queries.push({
      bool: {
        should: [
          {
            query_string: {
              query: normalizeFieldQuery(query.text), // todo assets-639: check how to deal with escape
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
  if (query.createdAt != null && Object.keys(query.createdAt).length > 0) {
    const createdAtFilter: QueryDslDateRangeQuery = {
      format: 'yyyy-MM-dd',
    };
    if (query.createdAt.min != null) {
      createdAtFilter.gte = query.createdAt.min.toString();
    }
    if (query.createdAt.max != null) {
      createdAtFilter.lte = query.createdAt.max.toString();
    }
    filters.push({
      range: {
        createdAt: createdAtFilter,
      },
    });
  }
  if (query.topicCodes != null) {
    filters.push(makeArrayFilter('topicCodes', query.topicCodes));
  }
  if (query.kindCodes != null) {
    filters.push(makeArrayFilter('kindCode', query.kindCodes));
  }
  if (query.usageCodes != null) {
    filters.push(makeArrayFilter('usageCode', query.usageCodes));
  }
  if (query.languageCodes != null) {
    filters.push(makeArrayFilter('languageCodes', query.languageCodes));
  }
  if (query.geometryTypes != null) {
    filters.push(makeArrayFilter('geometryTypes', query.geometryTypes));
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
        locations: {
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
  field: keyof ElasticsearchAsset,
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
  return query.replace(/(&&|\|\||!|\(|\)|\{|}|\[|]|\^|"|~|\*|\+|-|=|\?|:|\\|\/)/g, '\\$1');
};

const normalizeFieldQuery = (
  query: string,
): string => // todo assets-639: check how to deal with escape
  query
    .replace(/title(_*)public:/gi, 'title:')
    .replace(/title(_*)original:/gi, 'originalTitle:')
    .replace(/contact(_*)name:/gi, 'contactNames:')
    .replace(/asset(_*)id:/gi, 'id:')
    .replace(/sgs(_*)id:/gi, 'sgsId:');

/**
 * The state of a multistep asset search.
 */
interface SearchState {
  /**
   * The assets that match the search.
   * This is a mapping from the assets' id to their serialized JSON string.
   */
  matchedAssets: Map<AssetId, AssetJSON>;

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
