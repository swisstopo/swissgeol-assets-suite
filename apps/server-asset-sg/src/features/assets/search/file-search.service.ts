import { AssetSearchStats, FileSearchQuery, FileSearchResult, FileSearchResultItem, User } from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Injectable } from '@nestjs/common';
import { FILE_ELASTIC_INDEX } from '@/features/assets/search/asset-search.constants';
import { mapQueryToElasticDsl, PageOptions } from '@/features/assets/search/search-query.utils';
import { SearchService } from '@/features/assets/search/search.service';

@Injectable()
export class FileSearchService {
  private readonly searchService = new SearchService<number>(FILE_ELASTIC_INDEX, this.elastic);

  constructor(private readonly elastic: ElasticsearchClient) {}

  /**
   * Searches for files matching the text query, with asset metadata filters applied.
   * Results are grouped by file using ES collapse: each result item represents a single file
   * and contains a list of matching pages with their highlights.
   * Proper search_after pagination is applied via SearchService.
   */
  async search(
    query: FileSearchQuery,
    user: User,
    { limit = 100, offset = 0 }: PageOptions = {},
  ): Promise<FileSearchResult> {
    const elasticQuery = mapQueryToElasticDsl(query, user);
    const { results, total, counts } = await this.searchService.search(
      elasticQuery,
      { limit, offset },
      {
        entityIdField: 'fileId',
        sourceFields: ['fileId', 'assetId', 'title', 'fileName'],
        collapse: {
          field: 'fileId',
          innerHits: {
            name: 'pages',
            size: 100,
            sourceFields: ['page'],
            highlight: {
              content: {
                fragment_size: 150,
                number_of_fragments: 3,
                pre_tags: ['<em>'],
                post_tags: ['</em>'],
              },
            },
            sort: [{ page: 'asc' }],
          },
        },
        countAggs: { totalAssets: { field: 'assetId' } },
      },
    );

    const data: FileSearchResultItem[] = [];
    for (const hit of results.values()) {
      data.push({
        fileId: Number(hit.source?.['fileId']),
        assetId: Number(hit.source?.['assetId']),
        assetTitle: hit.source?.['title'] as string,
        fileName: hit.source?.['fileName'] as string,
        pages: (hit.innerHits?.['pages'] ?? []).map((p) => ({
          page: p.source['page'] as number,
          highlights: p.highlight?.['content'] ?? [],
        })),
      });
    }

    return {
      page: {
        offset,
        size: data.length,
        total,
      },
      totalAssets: counts['totalAssets'] ?? 0,
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
    return await this.searchService.aggregate(query, user, options);
  }
}
