import { AssetSearchQuery, AssetSearchQueryDTO, AssetSearchStats, AssetSearchStatsDTO } from '@asset-sg/shared';
import { AssetSearchResultDTO, User } from '@asset-sg/shared/v2';
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
import { AssetSearchService } from '@/features/assets/assets/search/asset-search.service';

@Controller('/assets/search')
@UseInterceptors(ClassSerializerInterceptor)
export class AssetSearchController {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  @Post('/')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: AssetSearchResultDTO, excludeExtraneousValues: true })
  async search(
    @ParseBody(AssetSearchQueryDTO)
    query: AssetSearchQuery,
    @CurrentUser() user: User,
    @Query('limit')
    limit?: number,
    @Query('offset')
    offset?: number,
  ): Promise<AssetSearchResultDTO> {
    limit = limit == null ? limit : Number(limit);
    offset = offset == null ? offset : Number(offset);
    restrictQueryForUser(query, user);
    return await this.assetSearchService.search(query, user, { limit, offset, decode: false });
  }

  @Post('/stats')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: AssetSearchStatsDTO })
  async showStats(
    @ParseBody(AssetSearchQueryDTO)
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
