import {
  AssetSearchQuery,
  AssetSearchResultItem,
  Geometry,
  GeometryAccessType,
  SearchQuerySchema,
  SearchType,
  serializeGeometryAsCsv,
  User,
} from '@asset-sg/shared/v2';
import { Controller, Post } from '@nestjs/common';
import { restrictQueryForUser } from '../assets/search/asset-search.utils';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';

@Controller('/geometries')
export class GeometriesController {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  @Post('/')
  @Authorize.User()
  async list(
    @ParseBody(SearchQuerySchema)
    body: SearchQuerySchema,
    @CurrentUser() user: User,
  ): Promise<string> {
    // Always query the asset index. When type is 'file', filter to assets that have files.
    const query: AssetSearchQuery = {
      type: SearchType.Asset,
      hasFiles: body.type === SearchType.File ? true : undefined,
    };
    restrictQueryForUser(query, user);
    const assets = await this.assetSearchService.search(query, user, { limit: 100_000_000, decode: false });

    const geometries = mapToGeometry(assets.data);
    return geometries.map((m) => serializeGeometryAsCsv(m)).join('\n');
  }
}

const mapToGeometry = (data: AssetSearchResultItem[]): Geometry[] => {
  return data.flatMap((d) => {
    return d.geometries.map((g) => ({
      assetId: d.id,
      accessType: d.isPublic ? GeometryAccessType.Public : GeometryAccessType.Internal,
      center: g.centroid,
      id: g.id,
      type: g.type,
    }));
  });
};
