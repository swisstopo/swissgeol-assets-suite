import {
  AssetId,
  AssetSearchStats,
  FileSearchQuery,
  FileSearchResult,
  FileSearchResultItem,
  SearchQueries,
  User,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { AggregationsAggregationContainer } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { AGGREGATION_NUMBER_OF_BUCKETS, FILE_ELASTIC_INDEX } from '@/features/assets/search/asset-search.constants';
import {
  mapQueryToElasticDsl,
  mapQueryToElasticDslParts,
  PageOptions,
} from '@/features/assets/search/search-query.utils';
import { SearchService } from '@/features/assets/search/search.service';

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

@Injectable()
export class FileSearchService {
  private readonly searchService = new SearchService<AssetId>(FILE_ELASTIC_INDEX, this.elastic);

  constructor(private readonly elastic: ElasticsearchClient) {}

  /**
   * Searches for files matching the text query, with asset metadata filters applied.
   * Results are grouped by file: each result item represents a single file
   * and contains a list of matching pages with their highlights.
   */
  async search(
    query: FileSearchQuery,
    user: User,
    { limit = 100, offset = 0, decode: shouldDecode = true }: PageOptions & { decode?: boolean } = {},
  ): Promise<FileSearchResult> {
    const elasticQuery = mapQueryToElasticDsl(query, user);

    // Fetch enough page-level hits to fill the requested file-level page.
    // We over-fetch because multiple page hits may collapse into the same file. @TODO What?
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

    const buckets = ((response.aggregations?.['files'] as Record<string, unknown>)?.['buckets'] ?? []) as FileBucket[];
    const totalFiles = buckets.length;

    // TODO: Apply proper pagination and offsetting

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
   * Aggregates the stats over the distinct assets for which there are file search results
   * matching a specific {@link FileSearchQuery}.
   *
   * The stats represent the asset-level facets (grouped by assetId), not the page-level counts.
   *
   * @param query The query to match with.
   * @param user The user that is executing the query.
   * @param options
   * @param options.unrestrictedWorkgroupQuery If provided, the workgroup aggregation will use this
   *   query instead of the main query. This allows admins to see counts for all workgroups
   *   while other stats remain restricted to their assigned workgroups.
   */
  async aggregateFiles(
    query: FileSearchQuery,
    user: User,
    options?: { unrestrictedWorkgroupQuery?: FileSearchQuery },
  ): Promise<AssetSearchStats> {
    const { must, filter, aggs } = mapQueryToElasticDslParts(query, user);

    // First, get the total number of distinct assets matching the full query.
    const totalResponse = await this.elastic.search({
      index: FILE_ELASTIC_INDEX,
      size: 0,
      query: { bool: { must, filter } },
      track_total_hits: true,
      ignore_unavailable: true,
      aggs,
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

    const makeAggregation = (
      operator: 'terms' | 'min' | 'max',
      groupName: string,
      fieldName?: string,
      queryOverride?: SearchQueries,
    ): AggregationsAggregationContainer => {
      const baseQuery = queryOverride ?? query;
      const { filter, aggs } = mapQueryToElasticDslParts({ ...baseQuery, [groupName]: undefined }, user);
      const field = fieldName ?? groupName;

      if (operator === 'terms') {
        return {
          filter: { bool: { filter } },
          aggs: {
            a: {
              terms: { field, size: AGGREGATION_NUMBER_OF_BUCKETS },
              aggs,
            },
          },
        };
      }
      // min/max — these are per-asset, but since all pages of an asset share the same
      // metadata values, min/max across pages is the same as min/max across assets.
      return {
        filter: { bool: { filter } },
        aggs: { a: { [operator]: { field } } },
      };
    };

    return await this.searchService.aggregate(query, user, makeAggregation, options);
  }
}
