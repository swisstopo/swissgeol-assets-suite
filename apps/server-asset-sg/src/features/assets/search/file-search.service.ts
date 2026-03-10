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
import { AggregationsAggregationContainer } from '@elastic/elasticsearch/lib/api/types';
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
   * Searches for files matching the text query, with asset metadata filters applied.
   * Results are grouped by file: each result item represents a single file
   * and contains a list of matching pages with their highlights.
   */
  async searchFiles(
    query: AssetSearchQuery,
    user: User,
    { limit = 100, offset = 0 }: PageOptions = {},
  ): Promise<FileSearchResult> {
    const elasticQuery = mapQueryToFileElasticDsl(query, user);

    // Fetch enough page-level hits to fill the requested file-level page.
    // We over-fetch because multiple page hits may collapse into the same file.
    const response = await this.elastic.search({
      index: FILE_ELASTIC_INDEX,
      query: elasticQuery,
      size: 0,
      _source: false,
      track_total_hits: true,
      aggs: {
        files: {
          terms: {
            field: 'fileId',
            size: 10_000,
          },
          aggs: {
            top_pages: {
              top_hits: {
                size: 100,
                _source: ['fileId', 'assetId', 'assetTitle', 'fileName', 'page'],
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
                sort: [{ page: 'asc' }],
              },
            },
          },
        },
      },
    });

    interface FileBucket {
      key: string | number;
      doc_count: number;
      top_pages: {
        hits: {
          hits: Array<{
            _source: Record<string, unknown>;
            highlight?: Record<string, string[]>;
          }>;
        };
      };
    }

    const buckets = ((response.aggregations?.['files'] as Record<string, unknown>)?.['buckets'] ?? []) as FileBucket[];
    const totalFiles = buckets.length;

    // Apply offset and limit on the file-level buckets.
    const paginatedBuckets = buckets.slice(offset, offset + limit);

    const data: FileSearchResultItem[] = paginatedBuckets.map((bucket) => {
      const firstHit = bucket.top_pages.hits.hits[0]._source;
      return {
        fileId: Number(firstHit['fileId']),
        assetId: Number(firstHit['assetId']),
        assetTitle: firstHit['assetTitle'] as string,
        fileName: firstHit['fileName'] as string,
        pages: bucket.top_pages.hits.hits.map((hit) => ({
          page: hit._source['page'] as number,
          highlights: hit.highlight?.['content'] ?? [],
        })),
      };
    });

    return {
      page: {
        offset,
        size: data.length,
        total: totalFiles,
      },
      data,
    };
  }

  /**
   * Count distinct files matching the query in the file index.
   */
  async countFilesByQuery(query: AssetSearchQuery, user: User): Promise<number> {
    const elasticQuery = mapQueryToFileElasticDsl(query, user);
    const response = await this.elastic.search({
      index: FILE_ELASTIC_INDEX,
      query: elasticQuery,
      size: 0,
      track_total_hits: false,
      ignore_unavailable: true,
      aggs: {
        distinct_files: {
          cardinality: {
            field: 'fileId',
          },
        },
      },
    });
    return (response.aggregations?.['distinct_files'] as { value: number })?.value ?? 0;
  }

  /**
   * Aggregates the stats over the distinct assets for which there are file search results
   * matching a specific {@link AssetSearchQuery}.
   *
   * The stats represent the asset-level facets (grouped by assetId), not the page-level counts.
   *
   * @param query The query to match with.
   * @param user The user that is executing the query.
   */
  async aggregateFiles(query: AssetSearchQuery, user: User): Promise<AssetSearchStats> {
    interface AggregationBucket<K = string> {
      key: K;
      doc_count: number;
      distinct_assets: { value: number };
    }

    const { must, filter } = mapQueryToFileElasticDslParts(query, user);

    // First, get the total number of distinct assets matching the full query.
    const totalResponse = await this.elastic.search({
      index: FILE_ELASTIC_INDEX,
      size: 0,
      query: { bool: { must, filter } },
      track_total_hits: true,
      ignore_unavailable: true,
      aggs: {
        distinct_assets: {
          cardinality: { field: 'assetId' },
        },
      },
    });
    const total = (totalResponse.aggregations?.['distinct_assets'] as { value: number })?.value ?? 0;
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

    // Build facet aggregations where each bucket counts distinct assets rather than pages.
    const NUMBER_OF_BUCKETS = 10_000;

    const makeAggregation = (
      operator: 'terms' | 'min' | 'max',
      groupName: string,
      fieldName?: string,
    ): AggregationsAggregationContainer => {
      const { filter: facetFilter } = mapQueryToFileElasticDslParts({ ...query, [groupName]: undefined }, user);
      const field = fieldName ?? groupName;

      if (operator === 'terms') {
        return {
          filter: { bool: { filter: facetFilter } },
          aggs: {
            a: {
              terms: { field, size: NUMBER_OF_BUCKETS },
              aggs: {
                distinct_assets: { cardinality: { field: 'assetId' } },
              },
            },
          },
        };
      }
      // min/max — these are per-asset, but since all pages of an asset share the same
      // metadata values, min/max across pages is the same as min/max across assets.
      return {
        filter: { bool: { filter: facetFilter } },
        aggs: { a: { [operator]: { field } } },
      };
    };

    const result = await this.elastic.search({
      index: FILE_ELASTIC_INDEX,
      size: 0,
      query: { bool: { must } },
      aggregations: {
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
      },
      filter_path: ['aggregations.*.a.buckets.*', 'aggregations.*.a.value'],
      ignore_unavailable: true,
    });

    type NestedAggResult<T> = { [K in keyof T]: { a: T[K] } };

    interface Result {
      minCreatedAt: { value: number };
      maxCreatedAt: { value: number };
      authorIds: { buckets: AggregationBucket<ContactId>[] };
      kindCodes: { buckets: AggregationBucket[] };
      languageCodes: { buckets: AggregationBucket[] };
      geometryTypes: { buckets: AggregationBucket<GeometryType | 'None'>[] };
      topicCodes: { buckets: AggregationBucket[] };
      status: { buckets: AggregationBucket<WorkflowStatus>[] };
      usageCodes: { buckets: AggregationBucket<AssetSearchUsageCode>[] };
      workgroupIds: { buckets: AggregationBucket<WorkgroupId>[] };
    }

    const aggs = result.aggregations as unknown as NestedAggResult<Result>;

    const mapBucket = <T>(bucket: AggregationBucket<T>): ValueCount<T> => ({
      value: bucket.key,
      count: bucket.distinct_assets?.value ?? bucket.doc_count,
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
