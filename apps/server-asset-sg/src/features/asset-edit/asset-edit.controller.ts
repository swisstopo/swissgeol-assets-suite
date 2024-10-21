import { PatchAsset } from '@asset-sg/shared';
import { AssetEditPolicy, Role, User } from '@asset-sg/shared/v2';
import { Controller, Get, HttpException, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { AssetEditRepo } from '@/features/asset-edit/asset-edit.repo';
import { AssetEditDetail, AssetEditService } from '@/features/asset-edit/asset-edit.service';

@Controller('/asset-edit')
export class AssetEditController {
  constructor(private readonly assetEditRepo: AssetEditRepo, private readonly assetEditService: AssetEditService) {}

  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<unknown> {
    const record = await this.assetEditRepo.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetEditPolicy, user).canShow(record);
    return AssetEditDetail.encode(record);
  }

  @Post('/')
  async create(@ParseBody(PatchAsset) patch: PatchAsset, @CurrentUser() user: User) {
    authorize(AssetEditPolicy, user).canCreate();
    validatePatch(user, patch);
    const result = await this.assetEditService.createAsset(user, patch)();
    if (E.isLeft(result)) {
      throw new HttpException(result.left.message, 500);
    }
    return result.right;
  }

  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ParseBody(PatchAsset) patch: PatchAsset,
    @CurrentUser() user: User
  ) {
    const record = await this.assetEditRepo.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    authorize(AssetEditPolicy, user).canUpdate(record);
    validatePatch(user, patch, record);

    const result = await this.assetEditService.updateAsset(user, record.assetId, patch)();
    if (E.isLeft(result)) {
      throw new HttpException(result.left.message, 500);
    }
    return result.right;
  }
}

const validatePatch = (user: User, patch: PatchAsset, record?: AssetEditDetail) => {
  const policy = new AssetEditPolicy(user);

  // Specialization of the policy where we disallow assets to be moved to another workgroup
  // if the current user is not an editor for that workgroup.
  if (!policy.hasRole(Role.Editor, patch.workgroupId)) {
    throw new HttpException(
      "Can't move asset to a workgroup for which the user is not an editor",
      HttpStatus.FORBIDDEN
    );
  }

  const checkStatusChange = (
    hasChanged: boolean,
    newStatus: string,
    allowedStatus: string,
    errorMessage: string,
    record: AssetEditDetail | undefined,
    policy: AssetEditPolicy,
    patchWorkgroupId: number
  ) => {
    if (
      hasChanged &&
      newStatus !== allowedStatus &&
      ((record != null && !policy.hasRole(Role.MasterEditor, record.workgroupId)) ||
        !policy.hasRole(Role.MasterEditor, patchWorkgroupId))
    ) {
      throw new HttpException(errorMessage, HttpStatus.FORBIDDEN);
    }
  };

  // Specialization of the policy where we disallow the internal status to be changed to anything else than `tobechecked`
  // if the current user is not a master-editor for the asset's current or future workgroup.
  const hasInternalUseChanged =
    record == null || record.internalUse.statusAssetUseItemCode !== patch.internalUse.statusAssetUseItemCode;
  checkStatusChange(
    hasInternalUseChanged,
    patch.internalUse.statusAssetUseItemCode,
    'tobechecked',
    "Changing the asset's status is not allowed",
    record,
    policy,
    patch.workgroupId
  );

  // Specialization of the policy where we disallow the public status to be changed to anything else than `tobechecked`
  // if the current user is not a master-editor for the asset's current or future workgroup.
  const hasPublicUseChanged =
    record == null || record.publicUse.statusAssetUseItemCode !== patch.publicUse.statusAssetUseItemCode;
  checkStatusChange(
    hasPublicUseChanged,
    patch.publicUse.statusAssetUseItemCode,
    'tobechecked',
    "Changing the asset's status is not allowed",
    record,
    policy,
    patch.workgroupId
  );

  // Specialization of the policy where we disallow the status work item code to be changed to `published`
  // if the current user is not a master-editor for the asset's current or future workgroup.
  if (
    O.toNullable(patch.newStatusWorkItemCode) === 'published' &&
    ((record != null && !policy.hasRole(Role.MasterEditor, record.workgroupId)) ||
      !policy.hasRole(Role.MasterEditor, patch.workgroupId))
  ) {
    throw new HttpException("Changing the asset's working status is not allowed", HttpStatus.FORBIDDEN);
  }
};
