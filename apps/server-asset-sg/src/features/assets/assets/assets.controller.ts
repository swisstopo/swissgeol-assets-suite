import {
  Asset,
  AssetData,
  AssetId,
  UsageStatusCode,
  User,
  Role,
  AssetPolicy,
  AssetDataSchema,
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
import { AssetRepo } from '@/features/assets/assets/asset.repo';

@Controller('/assets')
export class AssetsController {
  constructor(private readonly assetRepo: AssetRepo) {}

  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: AssetId, @CurrentUser() user: User): Promise<Asset> {
    const record = await this.assetRepo.find(id);
    if (record === null) {
      throw new HttpException('not found', 404);
    }
    authorize(AssetPolicy, user).canShow(record);
    return record;
  }

  @Post('/')
  async create(@ParseBody(AssetDataSchema) data: AssetData, @CurrentUser() user: User): Promise<Asset> {
    authorize(AssetPolicy, user).canCreate();
    validateData(user, data);
    return await this.assetRepo.create({ ...data, processor: user });
  }

  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ParseBody(AssetDataSchema) data: AssetData,
    @CurrentUser() user: User,
  ): Promise<Asset> {
    const record = await this.assetRepo.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    authorize(AssetPolicy, user).canUpdate(record);
    validateData(user, data, record);

    const asset = await this.assetRepo.update(record.id, { ...data, processor: user });
    if (asset === null) {
      throw new HttpException('not found', 404);
    }
    return asset;
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<void> {
    const record = await this.assetRepo.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetPolicy, user).canDelete(record);
    await this.assetRepo.delete(record.id);
  }
}

const validateData = (user: User, data: AssetData, record?: Asset) => {
  const policy = new AssetPolicy(user);

  // Specialization of the policy where we disallow assets to be moved to another workgroup
  // if the current user is not an editor for that workgroup.
  if (!policy.hasRole(Role.Editor, data.workgroupId)) {
    throw new HttpException(
      "Can't move asset to a workgroup for which the user is not an editor",
      HttpStatus.FORBIDDEN,
    );
  }

  // Specialization of the policy where we disallow the internal status to be changed to anything else than
  // `tobechecked` if the current user is not a master-editor for the asset's current or future workgroup.
  const hasInternalUseChanged = record == null || record.usage.internal.statusCode !== data.usage.internal.statusCode;
  if (
    hasInternalUseChanged &&
    data.usage.internal.statusCode !== UsageStatusCode.ToBeChecked &&
    ((record != null && !policy.hasRole(Role.Reviewer, record.workgroupId)) ||
      !policy.hasRole(Role.Reviewer, data.workgroupId))
  ) {
    throw new HttpException("Changing the asset's status is not allowed", HttpStatus.FORBIDDEN);
  }
};
