import {
  AssetSearchResultItem,
  Geometry,
  GeometryAccessType,
  SearchQueries,
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
import { FileSearchService } from '@/features/assets/search/file-search.service';

@Controller('/geometries')
export class GeometriesController {
  constructor(
    private readonly assetSearchService: AssetSearchService,
    private readonly fileSearchService: FileSearchService,
  ) {}

  @Post('/')
  @Authorize.User()
  async list(
    @ParseBody(SearchQuerySchema)
    body: SearchQuerySchema,
    @CurrentUser() user: User,
  ): Promise<string> {
    const query: SearchQueries = { type: body.type };
    restrictQueryForUser(query, user);
    let assetsItems: AssetSearchResultItem[] = [];

    switch (query.type) {
      case SearchType.File: {
        const files = await this.fileSearchService.search(query, user, { limit: 100_000_000 });
        assetsItems = files.assets;
        break;
      }
      case SearchType.Asset: {
        const assets = await this.assetSearchService.search(query, user, { limit: 100_000_000, decode: false });
        assetsItems = assets.data;
        break;
      }
    }

    const geometries = mapToGeometry(assetsItems);
    return geometries.map((m) => `${serializeGeometryAsCsv(m)}`).join('\n');
  }
}
const mapToGeometry: (data: AssetSearchResultItem[]) => Geometry[] = (data: AssetSearchResultItem[]) => {
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
