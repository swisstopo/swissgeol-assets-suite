import {
  AssetSearchQueryDTO,
  AssetSearchResult,
  AssetSearchResultDTO,
  AssetSearchStats,
  AssetSearchStatsDTO,
} from '@asset-sg/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Query, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { User } from '@/features/users/user.model';

@Controller('/assets/search')
export class AssetSearchController {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  @Post('/')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  async search(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: AssetSearchQueryDTO,
    @CurrentUser() user: User,

    @Query('limit')
    limit?: number,

    @Query('offset')
    offset?: number
  ): Promise<AssetSearchResult> {
    limit = limit == null ? limit : Number(limit);
    offset = offset == null ? offset : Number(offset);
    const result = await this.assetSearchService.search(query, user, { limit, offset, decode: false });
    return plainToInstance(AssetSearchResultDTO, result);
  }

  @Post('/stats')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  async showStats(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: AssetSearchQueryDTO,
    @CurrentUser() user: User
  ): Promise<AssetSearchStats> {
    const stats = await this.assetSearchService.aggregate(query, user);
    return plainToInstance(AssetSearchStatsDTO, stats);
  }
}
