import {
  AssetFilters,
  ElasticsearchGeometry,
  Geometry,
  GeometryAccessType,
  GeometryId,
  GeometryType,
  SearchQuerySchema,
  SearchType,
  serializeGeometryAsCsv,
  User,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import { Controller, Post } from '@nestjs/common';
import { restrictQueryForUser } from '../assets/search/asset-search.utils';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { ASSET_ELASTIC_INDEX, SEARCH_BATCH_SIZE } from '@/features/assets/search/asset-search.constants';

interface GeometryHit {
  id: string;
  isPublic: boolean;
  geometryData: ElasticsearchGeometry[];
}

@Controller('/geometries')
export class GeometriesController {
  constructor(private readonly elastic: ElasticsearchClient) {}

  @Post('/')
  @Authorize.User()
  async list(
    @ParseBody(SearchQuerySchema)
    body: SearchQuerySchema,
    @CurrentUser() user: User,
  ): Promise<string> {
    const filters: QueryDslQueryContainer[] = [];

    // Restrict to user's workgroups.
    const query: AssetFilters = {};
    restrictQueryForUser(query, user);
    if (query.workgroupIds != null) {
      filters.push({ terms: { workgroupId: query.workgroupIds } });
    }

    // When type is 'file', only include assets that have files.
    if (body.type === SearchType.File) {
      filters.push({ term: { hasFiles: true } });
    }

    const hits = await this.fetchAllHits(filters);
    const geometries: Geometry[] = hits.flatMap((hit) =>
      (hit.geometryData ?? []).map((g) => ({
        id: g.id as GeometryId,
        type: g.type as GeometryType,
        accessType: hit.isPublic ? GeometryAccessType.Public : GeometryAccessType.Internal,
        center: { x: g.centroidX, y: g.centroidY },
        assetId: parseInt(hit.id, 10),
      })),
    );
    return geometries.map((m) => serializeGeometryAsCsv(m)).join('\n');
  }

  private async fetchAllHits(filters: QueryDslQueryContainer[]): Promise<GeometryHit[]> {
    const hits: GeometryHit[] = [];
    let searchAfter: unknown[] | undefined;

    while (true) {
      const response = await this.elastic.search<GeometryHit>({
        index: ASSET_ELASTIC_INDEX,
        size: SEARCH_BATCH_SIZE,
        _source: ['id', 'isPublic', 'geometryData'],
        query: { bool: { filter: filters } },
        sort: [{ id: 'asc' }],
        ...(searchAfter != null ? { search_after: searchAfter } : {}),
      });

      const results = response.hits.hits;
      if (results.length === 0) {
        break;
      }

      for (const hit of results) {
        if (hit._source != null) {
          hits.push(hit._source);
        }
      }

      searchAfter = results[results.length - 1].sort;
    }

    return hits;
  }
}
