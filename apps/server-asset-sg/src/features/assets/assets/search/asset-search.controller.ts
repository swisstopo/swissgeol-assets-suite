import { AssetSearchQuery, AssetSearchQueryDTO, AssetSearchStats, AssetSearchStatsDTO } from '@asset-sg/shared';
import { AssetSearchResult, AssetSearchResultDTO, User } from '@asset-sg/shared/v2';
import { Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { AssetSearchService } from '@/features/assets/assets/search/asset-search.service';

@Controller('/assets/search')
export class AssetSearchController {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  @Post('/')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  async search(
    @ParseBody(AssetSearchQueryDTO)
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
    const result = await this.assetSearchService.search(query, user, { limit, offset, decode: false });
    return plainToInstance(AssetSearchResultDTO, result);
  }

  @Post('/stats')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  async showStats(
    @ParseBody(AssetSearchQueryDTO)
    query: AssetSearchQuery,
    @CurrentUser() user: User,
  ): Promise<AssetSearchStats> {
    restrictQueryForUser(query, user);
    const stats = await this.assetSearchService.aggregate(query, user);
    return plainToInstance(AssetSearchStatsDTO, stats);
  }
}

const restrictQueryForUser = (query: AssetSearchQuery, user: User) => {
  if (user.isAdmin) {
    return;
  }
  query.workgroupIds =
    query.workgroupIds == null ? [...user.roles.keys()] : query.workgroupIds.filter((it) => user.roles.has(it));
};
