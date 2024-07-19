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
import { Asset, AssetData, AssetId, UsageStatusCode } from '@shared/models/asset';

import { User } from '@shared/models/user';
import { Role } from '@shared/models/workgroup';
import { AssetEditPolicy } from '@shared/policies/asset-edit.policy';
import { AssetPolicy } from '@shared/policies/asset.policy';
import { AssetDataSchema } from '@shared/schemas/asset.schema';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { Authorized } from '@/core/decorators/authorized.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { Transform } from '@/core/decorators/transform.decorator';
import { UsePolicy } from '@/core/decorators/use-policy.decorator';
import { UseRepo } from '@/core/decorators/use-repo.decorator';
import { AssetRepo } from '@/features/assets/asset.repo';

@Controller('/assets')
@UseRepo(AssetRepo)
@UsePolicy(AssetPolicy)
export class AssetsController {
  constructor(private readonly assetRepo: AssetRepo) {}

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
    @Transform(AssetDataSchema) data: AssetData,
    @CurrentUser() user: User,
    @Authorized.Policy() policy: AssetEditPolicy
  ): Promise<Asset> {
    validateData(policy, data);
    return await this.assetRepo.create({ ...data, processor: user });
  }

  @Put('/:id')
  @Authorize.Update({ id: Number })
  async update(
    @Transform(AssetDataSchema) data: AssetData,
    @CurrentUser() user: User,
    @Authorized.Record() record: Asset,
    @Authorized.Policy() policy: AssetEditPolicy
  ): Promise<Asset> {
    validateData(policy, data, record);
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

const validateData = (policy: AssetEditPolicy, data: AssetData, record?: Asset) => {
  // Specialization of the policy where we disallow assets to be moved to another workgroup
  // if the current user is not an editor for that workgroup.
  if (!policy.canDoEverything() && !policy.hasRole(Role.Editor, data.workgroupId)) {
    throw new HttpException(
      "Can't move asset to a workgroup for which the user is not an editor",
      HttpStatus.FORBIDDEN
    );
  }

  // Specialization of the policy where we disallow the internal status to be changed to anything else than `tobechecked`
  // if the current user is not a master-editor for the asset's current or future workgroup.
  const hasInternalUseChanged = record == null || record.usage.internal.statusCode !== data.usage.internal.statusCode;
  if (
    hasInternalUseChanged &&
    data.usage.internal.statusCode !== UsageStatusCode.ToBeChecked &&
    ((record != null && !policy.hasRole(Role.MasterEditor, record.workgroupId)) ||
      !policy.hasRole(Role.MasterEditor, data.workgroupId))
  ) {
    throw new HttpException("Changing the asset's status is not allowed", HttpStatus.FORBIDDEN);
  }
};
