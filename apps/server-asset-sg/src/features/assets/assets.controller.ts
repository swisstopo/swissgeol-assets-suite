import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  ValidationPipe,
} from '@nestjs/common';

import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { RequireRole } from '@/core/decorators/require-role.decorator';
import { AssetInfoRepo } from '@/features/assets/asset-info.repo';
import { Asset, AssetDataBoundary, AssetId } from '@/features/assets/asset.model';
import { AssetRepo } from '@/features/assets/asset.repo';
import { Role, User } from '@/features/users/user.model';

@Controller('/assets')
export class AssetsController {
  constructor(private readonly assetRepo: AssetRepo, private readonly assetInfoRepo: AssetInfoRepo) {}

  @Get('/:id')
  @RequireRole(Role.Viewer)
  async show(@Param('id', ParseIntPipe) id: AssetId): Promise<Asset> {
    const asset = await this.assetRepo.find(id);
    if (asset === null) {
      throw new HttpException('not found', 404);
    }
    return asset;
  }

  @Post('/')
  @RequireRole(Role.MasterEditor)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    data: AssetDataBoundary,
    @CurrentUser() user: User
  ): Promise<Asset> {
    return await this.assetRepo.create({ ...data, processor: user });
  }

  @Put('/:id')
  @RequireRole(Role.MasterEditor)
  async update(
    @Param('id', ParseIntPipe) id: AssetId,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    data: AssetDataBoundary,
    @CurrentUser() user: User
  ): Promise<Asset> {
    const asset = await this.assetRepo.update(id, { ...data, processor: user });
    if (asset === null) {
      throw new HttpException('not found', 404);
    }
    return asset;
  }

  @Delete('/:id')
  @RequireRole(Role.MasterEditor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: AssetId): Promise<void> {
    const isOk = await this.assetRepo.delete(id);
    if (!isOk) {
      throw new HttpException('not found', 404);
    }
  }
}
