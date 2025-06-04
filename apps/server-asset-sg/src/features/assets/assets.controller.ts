import {
  UpdateAssetData,
  AssetId,
  AssetPolicy,
  User,
  CreateAssetData,
  CreateAssetDataSchema,
  UpdateAssetDataSchema,
  AssetSchema,
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
import { plainToInstance } from 'class-transformer';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { AssetService } from '@/features/assets/asset.service';

@Controller('/assets')
export class AssetsController {
  constructor(private readonly assetService: AssetService) {}

  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: AssetId, @CurrentUser() user: User): Promise<AssetSchema> {
    const record = await this.assetService.find(id);
    if (record === null) {
      throw new HttpException('not found', 404);
    }
    authorize(AssetPolicy, user).canShow(record);
    return plainToInstance(AssetSchema, record);
  }

  @Post('/')
  async create(
    @ParseBody(CreateAssetDataSchema) data: CreateAssetData,
    @CurrentUser() user: User,
  ): Promise<AssetSchema> {
    authorize(AssetPolicy, user).canCreate();
    const record = await this.assetService.create(data, user);
    return plainToInstance(AssetSchema, record);
  }

  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ParseBody(UpdateAssetDataSchema) data: UpdateAssetData,
    @CurrentUser() user: User,
  ): Promise<AssetSchema> {
    const record = await this.assetService.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetPolicy, user).canUpdate(record);
    const asset = await this.assetService.update(record, data, user);
    if (asset === null) {
      throw new HttpException('not found', 404);
    }
    return plainToInstance(AssetSchema, asset);
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
