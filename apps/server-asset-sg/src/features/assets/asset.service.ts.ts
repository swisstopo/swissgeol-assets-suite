import {
  Asset,
  UpdateAssetData,
  AssetId,
  AssetPolicy,
  Role,
  User,
  CreateAssetData,
  AssetData,
} from '@asset-sg/shared/v2';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileService } from '@/features/assets/files/file.service';

@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepo: AssetRepo,
    private readonly fileService: FileService,
    private readonly prismaService: PrismaService,
  ) {}

  find(id: AssetId): Promise<Asset | null> {
    return this.assetRepo.find(id);
  }

  async create(data: CreateAssetData, user: User): Promise<Asset> {
    await this.validateData(user, data);
    return this.assetRepo.create({ ...data, creatorId: user.id });
  }

  async update(asset: Asset, data: UpdateAssetData, user: User): Promise<Asset | null> {
    await this.validateData(user, data, asset);
    const updatedAsset = this.assetRepo.update(asset.id, data);
    // Remove any files that are no longer referenced by any asset.
    // This removes them both from the DB and from S3.
    // We do this after the request so unrelated errors and wait times do not impact the response.
    setTimeout(() => this.fileService.deleteOrphans());
    return updatedAsset;
  }

  delete(id: AssetId): Promise<boolean> {
    return this.assetRepo.delete(id);
  }

  private async validateData(user: User, data: AssetData, record?: Asset): Promise<void> {
    const policy = new AssetPolicy(user);

    // Specialization of the policy where we disallow assets to be moved to another workgroup
    // if the current user is not an editor for that workgroup.
    if (!policy.hasRole(Role.Editor, data.workgroupId)) {
      throw new HttpException(
        "Can't move asset to a workgroup for which the user is not an editor",
        HttpStatus.FORBIDDEN,
      );
    }

    // The following checks only relate to existing assets,
    // so we can skip them if the current action is a create.
    if (record === undefined) {
      return;
    }

    // Validate siblings.
    for (const assetYId of data.siblings) {
      // Ensure that the sibling is not the asset itself.
      if (assetYId === record.id) {
        throw new HttpException('Cannot assign asset as its own sibling', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      // Ensure that the sibling is in the same workgroup.
      const siblingCandidate = await this.prismaService.asset.findUnique({
        where: { assetId: assetYId },
        select: { workgroupId: true },
      });
      if (siblingCandidate?.workgroupId !== data.workgroupId) {
        throw new HttpException(
          'Cannot assign sibling asset from different workgroup',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    // Validate parent asset.
    if (data.parent !== null) {
      // Ensure that the parent is not the asset itself.
      if (data.parent === record.id) {
        throw new HttpException('Cannot assign asset as its own parent', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      // Ensure that the parent is in the same workgroup.
      const assetMain = await this.prismaService.asset.findUnique({
        where: { assetId: data.parent },
        select: { workgroupId: true },
      });
      if (assetMain?.workgroupId !== data.workgroupId) {
        throw new HttpException('Cannot assign parent asset from different workgroup', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }
  }
}
