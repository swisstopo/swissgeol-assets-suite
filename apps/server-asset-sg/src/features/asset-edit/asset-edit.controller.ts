import { PatchAsset } from '@asset-sg/shared';
import { Controller, Get, HttpException, HttpStatus, Post, Put } from '@nestjs/common';
import { User } from '@shared/models/user';
import { Role } from '@shared/models/workgroup';
import { AssetEditPolicy } from '@shared/policies/asset-edit.policy';
import * as E from 'fp-ts/Either';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { Authorized } from '@/core/decorators/authorized.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { Transform } from '@/core/decorators/transform.decorator';
import { UsePolicy } from '@/core/decorators/use-policy.decorator';
import { UseRepo } from '@/core/decorators/use-repo.decorator';
import { AssetEditRepo } from '@/features/asset-edit/asset-edit.repo';
import { AssetEditDetail, AssetEditService } from '@/features/asset-edit/asset-edit.service';

@Controller('/asset-edit')
@UseRepo(AssetEditRepo)
@UsePolicy(AssetEditPolicy)
export class AssetEditController {
  constructor(private readonly assetEditService: AssetEditService) {}

  @Get('/:id')
  @Authorize.Show({ id: Number })
  async show(@Authorized.Record() asset: AssetEditDetail): Promise<unknown> {
    return AssetEditDetail.encode(asset);
  }

  @Post('/')
  @Authorize.Create()
  async create(
    @Transform(PatchAsset) patch: PatchAsset,
    @CurrentUser() user: User,
    @Authorized.Policy() policy: AssetEditPolicy
  ) {
    validatePatch(policy, patch);
    const result = await this.assetEditService.createAsset(user, patch)();
    if (E.isLeft(result)) {
      throw new HttpException(result.left.message, 500);
    }
    return result.right;
  }

  @Put('/:id')
  @Authorize.Update({ id: Number })
  async update(
    @Transform(PatchAsset) patch: PatchAsset,
    @CurrentUser() user: User,
    @Authorized.Record() record: AssetEditDetail,
    @Authorized.Policy() policy: AssetEditPolicy
  ) {
    validatePatch(policy, patch, record);
    const result = await this.assetEditService.updateAsset(user, record.assetId, patch)();
    if (E.isLeft(result)) {
      throw new HttpException(result.left.message, 500);
    }
    return result.right;
  }
}

const validatePatch = (policy: AssetEditPolicy, patch: PatchAsset, record?: AssetEditDetail) => {
  // Specialization of the policy where we disallow assets to be moved to another workgroup
  // if the current user is not an editor for that workgroup.
  if (!policy.canDoEverything() && !policy.hasRole(Role.Editor, patch.workgroupId)) {
    throw new HttpException(
      "Can't move asset to a workgroup for which the user is not an editor",
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }

  // Specialization of the policy where we disallow the internal status to be changed to anything else than `tobechecked`
  // if the current user is not a master-editor for the asset's current or future workgroup.
  const hasInternalUseChanged =
    record == null || record.internalUse.statusAssetUseItemCode !== patch.internalUse.statusAssetUseItemCode;
  if (
    hasInternalUseChanged &&
    patch.internalUse.statusAssetUseItemCode !== 'tobechecked' &&
    ((record != null && !policy.hasRole(Role.MasterEditor, record.workgroupId)) ||
      !policy.hasRole(Role.MasterEditor, patch.workgroupId))
  ) {
    throw new HttpException("Changing the asset's status is not allowed", HttpStatus.UNPROCESSABLE_ENTITY);
  }
};
