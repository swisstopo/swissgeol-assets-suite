import { AssetId, AssetInfo, FavoritePolicy, User } from '@asset-sg/shared/v2';
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
import { AssetEditRepo } from '@/features/assets/asset-edit/asset-edit.repo';
import { AssetInfoRepo } from '@/features/assets/assets/asset-info.repo';
import { AssetSearchService } from '@/features/assets/assets/search/asset-search.service';
import { FavoriteRepo } from '@/features/assets/favorites/favorite.repo';

@Controller('/assets/favorites')
export class FavoritesController {
  constructor(
    private readonly favoriteRepo: FavoriteRepo,
    private readonly assetInfoRepo: AssetInfoRepo,
    private readonly assetEditRepo: AssetEditRepo,
    private readonly assetSearchService: AssetSearchService
  ) {}

  @Get('/')
  @Authorize.User()
  async list(@CurrentUser() user: User): Promise<AssetInfo[]> {
    return await this.assetInfoRepo.listFavorites(user.id);
  }

  @Get('/ids')
  @Authorize.User()
  async listIds(@CurrentUser() user: User): Promise<AssetId[]> {
    const assets = await this.assetInfoRepo.listFavorites(user.id);
    return assets.map(({ id }) => id);
  }

  @Post('/:assetId')
  @Authorize.User()
  @HttpCode(HttpStatus.NO_CONTENT)
  async create(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<void> {
    authorize(FavoritePolicy, user).canCreate();
    const asset = await this.assetEditRepo.find(assetId);
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
    const asset = await this.assetEditRepo.find(assetId);
    if (asset == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    const favorite = { userId: user.id, assetId };
    authorize(FavoritePolicy, user).canDelete(favorite);
    await this.favoriteRepo.delete(favorite);
    await this.assetSearchService.register(asset);
  }
}
