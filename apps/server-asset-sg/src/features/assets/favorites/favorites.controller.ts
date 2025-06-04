import { AssetId, FavoritePolicy, User } from '@asset-sg/shared/v2';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { authorize } from '@/core/authorize';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FavoriteRepo } from '@/features/assets/favorites/favorite.repo';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';

@Controller('/assets/favorites')
export class FavoritesController {
  constructor(
    private readonly favoriteRepo: FavoriteRepo,
    private readonly assetRepo: AssetRepo,
    private readonly assetSearchService: AssetSearchService,
  ) {}

  @Get('/ids')
  @Authorize.User()
  listIds(@CurrentUser() user: User): Promise<AssetId[]> {
    return this.assetRepo.listFavoriteIds(user.id);
  }

  @Post('/:assetId')
  @Authorize.User()
  @HttpCode(HttpStatus.NO_CONTENT)
  async create(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<void> {
    authorize(FavoritePolicy, user).canCreate();
    const asset = await this.assetRepo.find(assetId);
    if (asset == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    await this.favoriteRepo.create({ userId: user.id, assetId });
    await this.assetSearchService.register(asset);
  }

  @Delete('/:assetId')
  @Authorize.User()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<void> {
    const asset = await this.assetRepo.find(assetId);
    if (asset == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    const favorite = { userId: user.id, assetId };
    authorize(FavoritePolicy, user).canDelete(favorite);
    await this.favoriteRepo.delete(favorite);
    await this.assetSearchService.register(asset);
  }
}
