import {
  User,
  AssetSearchQuery,
  AssetSearchStats,
  AssetSearchStatsSchema,
  AssetSearchQuerySchema,
  AssetSearchResultSchema,
  AssetSearchResult,
} from '@asset-sg/shared/v2';
import {
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';

@Controller('/assets/search')
@UseInterceptors(ClassSerializerInterceptor)
export class AssetSearchController {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  @Post('/')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: AssetSearchResultSchema, excludeExtraneousValues: true })
  async search(
    @ParseBody(AssetSearchQuerySchema)
    query: AssetSearchQuery,
    @CurrentUser() user: User,
    @Query('limit')
    limit?: number,
    @Query('offset')
    offset?: number,
  ): Promise<AssetSearchResult> {
    limit = limit == null ? limit : Number(limit);
    offset = offset == null ? offset : Number(offset);
    restrictQueryForUser(query, user);
    return await this.assetSearchService.search(query, user, { limit, offset, decode: false });
  }

  @Post('/stats')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: AssetSearchStatsSchema })
  async showStats(
    @ParseBody(AssetSearchQuerySchema)
    query: AssetSearchQuery,
    @CurrentUser() user: User,
  ): Promise<AssetSearchStats> {
    restrictQueryForUser(query, user);
    return await this.assetSearchService.aggregate(query, user);
  }
}

const restrictQueryForUser = (query: AssetSearchQuery, user: User) => {
  if (user.isAdmin) {
    return;
  }
  query.workgroupIds =
    query.workgroupIds == null ? [...user.roles.keys()] : query.workgroupIds.filter((it) => user.roles.has(it));
};
