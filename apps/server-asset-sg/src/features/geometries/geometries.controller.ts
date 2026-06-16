import {
  AssetSearchQuery,
  AssetSearchResultItem,
  Geometry,
  GeometryAccessType,
  SearchType,
  serializeGeometryAsCsv,
  User,
} from '@asset-sg/shared/v2';
import { Controller, Post } from '@nestjs/common';
import { restrictQueryForUser } from '../assets/search/asset-search.utils';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';

@Controller('/geometries')
export class GeometriesController {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  @Post('/')
  @Authorize.User()
  async list(@CurrentUser() user: User): Promise<string> {
    const query: AssetSearchQuery = { type: SearchType.Asset };
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
