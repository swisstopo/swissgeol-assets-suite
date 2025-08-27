import {
  AssetSearchQuery,
  AssetSearchQuerySchema,
  AssetSearchResult,
  Geometry,
  GeometryAccessType,
  serializeGeometryAsCsv,
  User,
} from '@asset-sg/shared/v2';
import { Controller, Get } from '@nestjs/common';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';

@Controller('/geometries')
export class GeometriesController {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  @Get('/')
  @Authorize.User()
  async list(
    @ParseBody(AssetSearchQuerySchema)
    query: AssetSearchQuery,
    @CurrentUser() user: User,
  ): Promise<string> {
    const geometries = await this.assetSearchService.search(query, user, { limit: 100_000_000, decode: false });
    const mappedGeometries = mapToGeometry(geometries);

    return mappedGeometries.map((m) => `${serializeGeometryAsCsv(m)}`).join('\n');
  }
}
const mapToGeometry: (data: AssetSearchResult) => Geometry[] = ({ data }: AssetSearchResult) => {
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
