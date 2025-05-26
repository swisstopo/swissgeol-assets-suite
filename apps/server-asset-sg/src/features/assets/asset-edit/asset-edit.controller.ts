import { unknownToError } from '@asset-sg/core';
import { AssetByTitle, AssetEditDetail, PatchAsset } from '@asset-sg/shared';
import { AssetEditPolicy, Role, User } from '@asset-sg/shared/v2';
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
  Query,
} from '@nestjs/common';
import { authorize } from '@/core/authorize';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { AssetEditRepo } from '@/features/assets/asset-edit/asset-edit.repo';
import { AssetEditService } from '@/features/assets/asset-edit/asset-edit.service';
import { AssetSearchService } from '@/features/assets/assets/search/asset-search.service';

@Controller('/asset-edit')
export class AssetEditController {
  constructor(
    private readonly assetEditRepo: AssetEditRepo,
    private readonly assetEditService: AssetEditService,
    private readonly assetSearchService: AssetSearchService,
  ) {}

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

    await this.assetEditService.validateReferencesOrThrow({ user, patch });

    const asset = await this.assetEditRepo.create({ user, patch });
    await this.assetSearchService.register(asset);
    return AssetEditDetail.encode(asset);
  }

  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ParseBody(PatchAsset) patch: PatchAsset,
    @CurrentUser() user: User,
  ) {
    const record = await this.assetEditRepo.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    authorize(AssetEditPolicy, user).canUpdate(record);
    validatePatch(user, patch, record);
    await this.assetEditService.validateReferencesOrThrow({ user, patch }, id);

    const asset = await this.assetEditRepo.update(record.assetId, { user, patch });
    if (asset === null) {
      throw new HttpException('not found', 404);
    }
    await this.assetSearchService.register(asset);
    return AssetEditDetail.encode(asset);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<void> {
    const record = await this.assetEditRepo.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetEditPolicy, user).canDelete(record);
    const success = await this.assetEditRepo.delete(record.assetId);
    if (!success) {
      throw new HttpException('could not delete', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    await this.assetSearchService.deleteFromIndex(record.assetId);
  }

  /**
   * @deprecated
   */
  @Get('/asset-edit/search')
  @Authorize.User()
  async searchAssetsByTitle(@Query('title') title: string): Promise<AssetByTitle[]> {
    try {
      return await this.assetSearchService.searchByTitle(title);
    } catch (e) {
      throw new HttpException(unknownToError(e).message, 500);
    }
  }
}

const validatePatch = (user: User, patch: PatchAsset, record?: AssetEditDetail) => {
  const policy = new AssetEditPolicy(user);

  // Specialization of the policy where we disallow assets to be moved to another workgroup
  // if the current user is not an editor for that workgroup.
  if (!policy.hasRole(Role.Editor, patch.workgroupId)) {
    throw new HttpException(
      "Can't move asset to a workgroup for which the user is not an editor",
      HttpStatus.FORBIDDEN,
    );
  }
};
