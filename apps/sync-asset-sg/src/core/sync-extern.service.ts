import { PrismaClient } from '@prisma/client';
import { SyncConfig } from './config';
import { log } from './log';

export class SyncExternService {
  private readonly config: SyncConfig;

  private readonly sourcePrisma: PrismaClient;
  private readonly destinationPrisma: PrismaClient;

  private readonly batchSize = 500;

  constructor(sourcePrisma: PrismaClient, destinationPrisma: PrismaClient, config: SyncConfig) {
    this.config = config;
    this.sourcePrisma = sourcePrisma;
    this.destinationPrisma = destinationPrisma;
  }

  /**
   * Synchronize data between source and destination databases.
   * All content in source database should be copied to destination database.
   * Only assets from the allowed workgroups should be copied.
   * From the destination database, only the assets with workgroup in destination workgroup ids
   * should be copied.
   */
  public async syncProdAndExtern() {
    log('Starting data export to extern');

    const sourceAssets = await this.sourcePrisma.asset.findMany({
      where: {
        workgroup: {
          id: {
            in: this.config.source.allowedWorkgroupIds,
          },
        },
      },
    });

    log(`Found ${sourceAssets.length} assets in source database`);

    const destinationAssets = await this.destinationPrisma.asset.findMany({
      where: {
        workgroup: {
          id: {
            in: this.config.destination.allowedWorkgroupIds,
          },
        },
      },
    });

    log(`Found ${destinationAssets.length} assets in destination database`);

    const sourceAssetIds = new Set(sourceAssets.map((asset) => asset.assetId));
    const destinationAssetIds = new Set(destinationAssets.map((asset) => asset.assetId));

    const assetsToCopy = sourceAssets.filter((asset) => !destinationAssetIds.has(asset.assetId));

    log(`Found ${assetsToCopy.length} assets to copy`);

    for (let i = 0; i < assetsToCopy.length; i += this.batchSize) {
      const batch = assetsToCopy.slice(i, i + this.batchSize);
      await this.destinationPrisma.asset.createMany({
        data: batch,
      });
      log(`Copied ${batch.length} assets`);
    }

    log('Data export to extern completed');
  }
}
