import { AssetId, AssetPolicy, GeometryDetailSchema, User } from '@asset-sg/shared/v2';
import { Controller, Get, HttpException, HttpStatus, Param, ParseIntPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { AssetService } from '@/features/assets/asset.service';

@Controller('/assets/:id/geometries')
export class AssetGeometriesController {
  constructor(private readonly assetService: AssetService) {}

  @Get('/')
  async list(@Param('id', ParseIntPipe) id: AssetId, @CurrentUser() user: User): Promise<GeometryDetailSchema[]> {
    const record = await this.assetService.find(id);
    if (record === null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetPolicy, user).canShow(record);
    const records = await this.assetService.listGeometries(id);
    return records.map((it) => plainToInstance(GeometryDetailSchema, it));
  }
}
