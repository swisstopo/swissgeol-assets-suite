import {
  AssetSearchQuery,
  AssetSearchQuerySchema,
  AssetSearchResult,
  AssetSearchResultSchema,
  AssetSearchStats,
  AssetSearchStatsSchema,
  User,
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
import { restrictQueryForUser } from '@/features/assets/search/asset-search.utils';

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
    if (user.isAdmin) {
      // For admins: restrict stats to their workgroups, but keep workgroup
      // counts unrestricted so they can discover all workgroups.
      const unrestrictedWorkgroupQuery = { ...query };
      restrictQueryForUser(query, user);
      return await this.assetSearchService.aggregate(query, user, { unrestrictedWorkgroupQuery });
    }
    restrictQueryForUser(query, user);
    return await this.assetSearchService.aggregate(query, user);
  }
}
