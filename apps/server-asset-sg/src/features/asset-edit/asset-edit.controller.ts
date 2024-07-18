import { PatchAsset } from '@asset-sg/shared';
import { Controller, Get, HttpException, HttpStatus, Post, Put } from '@nestjs/common';
import * as E from 'fp-ts/Either';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { Authorized } from '@/core/decorators/authorized.decorator';
import { Boundary } from '@/core/decorators/boundary.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { UsePolicy } from '@/core/decorators/use-policy.decorator';
import { UseRepo } from '@/core/decorators/use-repo.decorator';
import { AssetEditPolicy } from '@/features/asset-edit/asset-edit.policy';
import { AssetEditRepo } from '@/features/asset-edit/asset-edit.repo';
import { AssetEditDetail, AssetEditService } from '@/features/asset-edit/asset-edit.service';
import { User } from '@/features/users/user.model';
import { Role } from '@/features/workgroups/workgroup.model';

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

  /**
   * @deprecated
   */
  @Post('/')
  @Authorize.Create()
  async create(
    @Boundary(PatchAsset) patch: PatchAsset,
    @CurrentUser() user: User,
    @Authorized.Policy() policy: AssetEditPolicy
  ) {
    validatePatch(patch, policy);
    const result = await this.assetEditService.createAsset(user, patch)();
    if (E.isLeft(result)) {
      throw new HttpException(result.left.message, 500);
    }
    return result.right;
  }

  @Put('/:id')
  @Authorize.Update({ id: Number })
  async update(
    @Boundary(PatchAsset) patch: PatchAsset,
    @CurrentUser() user: User,
    @Authorized.Record() asset: AssetEditDetail,
    @Authorized.Policy() policy: AssetEditPolicy
  ) {
    validatePatch(patch, policy);
    const result = await this.assetEditService.updateAsset(user, asset.assetId, patch)();
    if (E.isLeft(result)) {
      throw new HttpException(result.left.message, 500);
    }
    return result.right;
  }
}

const validatePatch = (patch: PatchAsset, policy: AssetEditPolicy) => {
  // Specialization of the policy where we disallow assets to be moved to another workgroup
  // if the current user is not an editor for that workgroup.
  if (!policy.canDoEverything() && !policy.hasRole(Role.Editor, patch.workgroupId)) {
    throw new HttpException(
      "Can't move asset to a workgroup for which the user is not an editor",
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
};
