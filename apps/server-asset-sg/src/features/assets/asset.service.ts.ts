import { Asset, AssetData, AssetId, UserId } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileService } from '@/features/assets/files/file.service';

@Injectable
export class AssetService {
  constructor(
    private readonly assetRepo: AssetRepo,
    private readonly fileService: FileService,
  ) {}

  find(id: AssetId): Promise<Asset | null> {
    return this.assetRepo.find(id);
  }

  create(data: AssetData, creatorId: UserId): Promise<Asset> {
    return this.assetRepo.create({ ...data, creatorId });
  }

  async update(data: AssetData): Promise<Asset | null> {
    const asset = this.assetRepo.update(data);
    // Remove any files that are no longer referenced by any asset.
    // This removes them both from the DB and from S3.
    // We do this after the request so unrelated errors and wait times do not impact the response.
    setTimeout(() => this.fileService.deleteOrphans());
    return asset;
  }

  delete(id: AssetId): Promise<boolean> {
    return this.assetRepo.delete(id);
  }
}
