import {
  Asset,
  UpdateAssetData,
  AssetId,
  AssetPolicy,
  User,
  CreateAssetData,
  CreateAssetDataSchema,
  UpdateAssetDataSchema,
} from '@asset-sg/shared/v2';
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
  Put,
} from '@nestjs/common';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { AssetService } from '@/features/assets/asset.service.ts';

@Controller('/assets')
export class AssetsController {
  constructor(private readonly assetService: AssetService) {}

  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: AssetId, @CurrentUser() user: User): Promise<Asset> {
    const record = await this.assetService.find(id);
    if (record === null) {
      throw new HttpException('not found', 404);
    }
    authorize(AssetPolicy, user).canShow(record);
    return record;
  }

  @Post('/')
  async create(@ParseBody(CreateAssetDataSchema) data: CreateAssetData, @CurrentUser() user: User): Promise<Asset> {
    authorize(AssetPolicy, user).canCreate();
    return await this.assetService.create(data, user);
  }

  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ParseBody(UpdateAssetDataSchema) data: UpdateAssetData,
    @CurrentUser() user: User,
  ): Promise<Asset> {
    const record = await this.assetService.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetPolicy, user).canUpdate(record);
    const asset = await this.assetService.update(record, data, user);
    if (asset === null) {
      throw new HttpException('not found', 404);
    }
    return asset;
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<void> {
    const record = await this.assetService.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetPolicy, user).canDelete(record);
    await this.assetService.delete(record.id);
  }
}
