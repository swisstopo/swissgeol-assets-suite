import {
  AssetSearchQueryDTO,
  AssetSearchResult,
  AssetSearchResultDTO,
  AssetSearchStats,
  AssetSearchStatsDTO,
} from '@asset-sg/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Query, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';

@Controller('/assets/search')
export class AssetSearchController {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  @Post('/')
  @HttpCode(HttpStatus.OK)
  async search(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: AssetSearchQueryDTO,

    @Query('limit')
    limit?: number,

    @Query('offset')
    offset?: number
  ): Promise<AssetSearchResult> {
    limit = limit == null ? limit : Number(limit);
    offset = offset == null ? offset : Number(offset);
    const result = await this.assetSearchService.search(query, { limit, offset, decode: false });
    return plainToInstance(AssetSearchResultDTO, result);
  }

  @Post('/stats')
  @HttpCode(HttpStatus.OK)
  async showStats(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: AssetSearchQueryDTO
  ): Promise<AssetSearchStats> {
    const stats = await this.assetSearchService.aggregate(query);
    return plainToInstance(AssetSearchStatsDTO, stats);
  }
}
