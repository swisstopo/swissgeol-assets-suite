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

import { Authorize } from '@/core/decorators/authorize.decorator';
import { Authorized } from '@/core/decorators/authorized.decorator';
import { Boundary } from '@/core/decorators/boundary.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { UsePolicy } from '@/core/decorators/use-policy.decorator';
import { UseRepo } from '@/core/decorators/use-repo.decorator';
import { AssetEditPolicy } from '@/features/asset-edit/asset-edit.policy';
import { AssetInfoRepo } from '@/features/assets/asset-info.repo';
import { Asset, AssetData, AssetDataBoundary, AssetId } from '@/features/assets/asset.model';
import { AssetPolicy } from '@/features/assets/asset.policy';
import { AssetRepo } from '@/features/assets/asset.repo';
import { User } from '@/features/users/user.model';
import { Role } from '@/features/workgroups/workgroup.model';

@Controller('/assets')
@UseRepo(AssetRepo)
@UsePolicy(AssetPolicy)
export class AssetsController {
  constructor(private readonly assetRepo: AssetRepo, private readonly assetInfoRepo: AssetInfoRepo) {}

  @Get('/:id')
  @Authorize.Show({ id: Number })
  async show(@Param('id', ParseIntPipe) id: AssetId): Promise<Asset> {
    const asset = await this.assetRepo.find(id);
    if (asset === null) {
      throw new HttpException('not found', 404);
    }
    return asset;
  }

  @Post('/')
  @Authorize.Create()
  async create(
    @Boundary(AssetDataBoundary) data: AssetData,
    @CurrentUser() user: User,
    @Authorized.Policy() policy: AssetEditPolicy
  ): Promise<Asset> {
    validateData(data, policy);
    return await this.assetRepo.create({ ...data, processor: user });
  }

  @Put('/:id')
  @Authorize.Update({ id: Number })
  async update(
    @Boundary(AssetDataBoundary) data: AssetData,
    @CurrentUser() user: User,
    @Authorized.Record() record: Asset,
    @Authorized.Policy() policy: AssetEditPolicy
  ): Promise<Asset> {
    validateData(data, policy);
    const asset = await this.assetRepo.update(record.id, { ...data, processor: user });
    if (asset === null) {
      throw new HttpException('not found', 404);
    }
    return asset;
  }

  @Delete('/:id')
  @Authorize.Delete({ id: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Authorized.Record() record: Asset): Promise<void> {
    await this.assetRepo.delete(record.id);
  }
}

const validateData = (data: AssetData, policy: AssetEditPolicy) => {
  // Specialization of the policy where we disallow assets to be moved to another workgroup
  // if the current user is not an editor for that workgroup.
  if (!policy.canDoEverything() && !policy.hasRole(Role.Editor, data.workgroupId)) {
    throw new HttpException(
      "Can't move asset to a workgroup for which the user is not an editor",
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
};
