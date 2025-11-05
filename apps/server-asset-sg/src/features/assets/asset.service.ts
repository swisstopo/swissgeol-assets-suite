import {
  Asset,
  UpdateAssetData,
  AssetId,
  AssetPolicy,
  Role,
  User,
  CreateAssetData,
  AssetData,
  GeometryDetail,
} from '@asset-sg/shared/v2';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileService } from '@/features/assets/files/file.service';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { WorkflowService } from '@/features/assets/workflow/workflow.service';
import { GeometryDetailRepo } from '@/features/geometries/geometry-detail.repo';

@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepo: AssetRepo,
    private readonly assetSearchService: AssetSearchService,
    private readonly workflowService: WorkflowService,
    private readonly geometryDetailRepo: GeometryDetailRepo,
    private readonly fileService: FileService,
    private readonly prismaService: PrismaService,
  ) {}

  find(id: AssetId): Promise<Asset | null> {
    return this.assetRepo.find(id);
  }

  listGeometries(id: AssetId): Promise<GeometryDetail[]> {
    return this.geometryDetailRepo.list({ assetIds: [id] });
  }

  async create(data: CreateAssetData, user: User): Promise<Asset> {
    await this.validateData(user, data);
    const asset = await this.assetRepo.create({ ...data, creatorId: user.id });
    await this.assetSearchService.register(asset);
    return asset;
  }

  async update(asset: Asset, data: UpdateAssetData, user: User): Promise<Asset | null> {
    await this.validateData(user, data, asset);

    const updatedAsset = await this.assetRepo.update(asset.id, data);
    if (updatedAsset === null) {
      return null;
    }

    // Find all files that have been removed by checking which files only exist in the old asset data.
    const removedFiles = asset.files.filter(
      (oldFile) => undefined === updatedAsset.files.find((newFile) => newFile.id === oldFile.id),
    );

    const [syncedAsset] = await Promise.all([
      this.fileService.syncAssetWithRemovedFiles(updatedAsset, removedFiles),
      this.assetSearchService.register(updatedAsset),
      this.workflowService.updateSelectionByChanges(asset, updatedAsset, data.geometries),
    ]);

    // Remove any files that are no longer referenced by any asset.
    // This removes them both from the DB and from S3.
    // We do this after the request so unrelated errors and wait times do not impact the response.
    setTimeout(() => this.fileService.deleteOrphans());

    return syncedAsset;
  }

  async delete(id: AssetId): Promise<boolean> {
    const [ok] = await Promise.all([this.assetRepo.delete(id), this.assetSearchService.deleteFromIndex(id)]);
    return ok;
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
