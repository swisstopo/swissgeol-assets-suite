import {
  AssetId,
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchResultItem,
  AssetSearchResultItemSchema,
  AssetSearchStats,
  User,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ASSET_ELASTIC_INDEX } from '@/features/assets/search/asset-search.constants';
import { mapQueryToElasticDsl, PageOptions } from '@/features/assets/search/search-query.utils';
import { SearchService } from '@/features/assets/search/search.service';

@Injectable()
export class AssetSearchService {
  private readonly searchService = new SearchService<AssetId>(ASSET_ELASTIC_INDEX, this.elastic);

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
    const elasticQuery = mapQueryToElasticDsl(query, user);
    const { results: serializedAssets, total } = await this.searchService.search(elasticQuery, {
      limit,
      offset,
    });

    const data: AssetSearchResultItem[] = [];
    for (const serializedAsset of serializedAssets.values()) {
      const encodedAsset = JSON.parse(serializedAsset);
      data.push(
        shouldDecode
          ? plainToInstance(AssetSearchResultItemSchema, encodedAsset, { excludeExtraneousValues: true })
          : encodedAsset,
      );
    }

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
   * @param options
   * @param options.unrestrictedWorkgroupQuery If provided, the workgroup aggregation will use this
   *   query instead of the main query. This allows admins to see counts for all workgroups
   *   while other stats remain restricted to their assigned workgroups.
   */
  async aggregate(
    query: AssetSearchQuery,
    user: User,
    options?: { unrestrictedWorkgroupQuery?: AssetSearchQuery },
  ): Promise<AssetSearchStats> {
    return await this.searchService.aggregate(query, user, options);
  }
}
