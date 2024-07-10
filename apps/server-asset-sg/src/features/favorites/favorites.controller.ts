import { SearchAssetResult, SearchAssetResultEmpty } from '@asset-sg/shared';
import { User } from '@asset-sg/shared/v2';
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Put } from '@nestjs/common';

import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { FavoriteRepo } from '@/features/favorites/favorite.repo';
import { define } from '@/utils/define';

@Controller('/users/current/favorites')
export class FavoritesController {
  constructor(private readonly favoriteRepo: FavoriteRepo, private readonly assetSearchService: AssetSearchService) {}

  // TODO make an alternative, new endpoint for this that does not use fp-ts.
  @Get('/')
  @Authorize.User()
  async list(@CurrentUser() user: User): Promise<SearchAssetResult> {
    const favorites = await this.favoriteRepo.listByUserId(user.id);
    if (favorites.length === 0) {
      return define<SearchAssetResultEmpty>({ _tag: 'SearchAssetResultEmpty' });
    }
    const assetIds = favorites.map((it) => it.assetId);
    return await this.assetSearchService.searchOld('', { scope: ['titlePublic'], assetIds });
  }

  @Put('/:assetId')
  @Authorize.User()
  @HttpCode(HttpStatus.NO_CONTENT)
  async add(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<void> {
    await this.favoriteRepo.create({ userId: user.id, assetId });
  }

  @Delete('/:assetId')
  @Authorize.User()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<void> {
    await this.favoriteRepo.delete({ userId: user.id, assetId });
  }
}
