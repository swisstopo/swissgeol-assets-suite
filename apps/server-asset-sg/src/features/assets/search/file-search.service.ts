import {
  AssetSearchQuery,
  AssetSearchStats,
  AssetSearchUsageCode,
  ContactId,
  FileSearchResult,
  FileSearchResultItem,
  GeometryType,
  LocalDate,
  User,
  ValueCount,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { AggregationsAggregationContainer, SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { WorkflowStatus } from '@swissgeol/ui-core';
import { FILE_ELASTIC_INDEX } from '@/features/assets/search/asset-search.constants';
import {
  mapQueryToFileElasticDsl,
  mapQueryToFileElasticDslParts,
  PageOptions,
} from '@/features/assets/search/asset-search.query';

@Injectable()
export class FileSearchService {
  constructor(private readonly elastic: ElasticsearchClient) {}

  /**
   * Searches for file pages matching the text query, with asset metadata filters applied.
   * Returns file results with highlights.
   */
  async searchFiles(
    query: AssetSearchQuery,
    user: User,
    { limit = 100, offset = 0 }: PageOptions = {},
  ): Promise<FileSearchResult> {
    const elasticQuery = mapQueryToFileElasticDsl(query, user);

    const response = await this.elastic.search({
      index: FILE_ELASTIC_INDEX,
      query: elasticQuery,
      size: limit,
      from: offset,
      highlight: {
        fields: {
          content: {
            fragment_size: 150,
            number_of_fragments: 3,
            pre_tags: ['<em>'],
            post_tags: ['</em>'],
          },
        },
      },
      _source: ['fileId', 'assetId', 'assetTitle', 'fileName', 'page'],
      track_total_hits: true,
    });

    const fileTotal = (response.hits.total as SearchTotalHits).value;

    const data: FileSearchResultItem[] = response.hits.hits.map((hit) => {
      const source = hit._source as Record<string, unknown>;
      const highlights = hit.highlight?.['content'] ?? [];
      return {
        fileId: source['fileId'] as number,
        assetId: source['assetId'] as number,
        assetTitle: source['assetTitle'] as string,
        fileName: source['fileName'] as string,
        page: source['page'] as number,
        highlights,
      };
    });

    return {
      page: {
        offset,
        size: data.length,
        total: fileTotal,
      },
      data,
    };
  }

  /**
   * Count file pages matching the query in the file index.
   */
  async countFilesByQuery(query: AssetSearchQuery, user: User): Promise<number> {
    const elasticQuery = mapQueryToFileElasticDsl(query, user);
    const response = await this.elastic.count({
      index: FILE_ELASTIC_INDEX,
      query: elasticQuery,
      ignore_unavailable: true,
    });
    return response.count;
  }

  /**
   * Aggregates the stats over all file pages matching a specific {@link AssetSearchQuery}.
   * Runs on the file index, which has the same denormalized metadata fields as the asset index.
   *
   * @param query The query to match with.
   * @param user The user that is executing the query.
   */
  async aggregateFiles(query: AssetSearchQuery, user: User): Promise<AssetSearchStats> {
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
    ): AggregationsAggregationContainer => {
      const NUMBER_OF_BUCKETS = 10_000;
      const { filter } = mapQueryToFileElasticDslParts({ ...query, [groupName]: undefined }, user);
      const field: { field: string; size?: number } = { field: fieldName ?? groupName, size: NUMBER_OF_BUCKETS };
      if (operator !== 'terms') {
        delete field.size;
      }
      return { aggs: { a: { [operator]: field } }, filter: { bool: { filter } } };
    };

    const { must, filter } = mapQueryToFileElasticDslParts(query, user);

    const response = await this.elastic.search({
      index: FILE_ELASTIC_INDEX,
      size: 0,
      query: { bool: { must, filter } },
      track_total_hits: true,
      ignore_unavailable: true,
    });
    const total = (response.hits.total as SearchTotalHits | undefined)?.value ?? 0;
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
        status: [],
      };
    }

    const aggregateByQuery = async (aggs: Record<string, AggregationsAggregationContainer>) => {
      return await this.elastic.search({
        index: FILE_ELASTIC_INDEX,
        size: 0,
        query: { bool: { must } },
        track_total_hits: true,
        aggregations: aggs,
        filter_path: ['aggregations.*.a.buckets.*', 'aggregations.*.a.value'],
        ignore_unavailable: true,
      });
    };

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
      createdAt: {
        min: LocalDate.fromDate(new Date(aggs.minCreatedAt.a.value)),
        max: LocalDate.fromDate(new Date(aggs.maxCreatedAt.a.value)),
      },
      status: aggs.status?.a?.buckets?.map(mapBucket) ?? [],
    };
  }
}
