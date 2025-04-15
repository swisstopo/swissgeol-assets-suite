import fs from 'fs/promises';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AssetRepo } from '@/features/assets/assets/asset.repo';
import { AssetSearchService } from '@/features/assets/assets/search/asset-search.service';

@Injectable()
export class AssetSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AssetSyncService.name);

  constructor(
    private readonly assetSearchService: AssetSearchService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly assetRepo: AssetRepo,
  ) {}

  async onApplicationBootstrap() {
    const syncFileExists = await this.isSyncRunning();
    if (syncFileExists) {
      fs.rm(assetSyncFile).then();
    }

    if (process.env.ANONYMOUS_MODE === 'true') {
      this.logger.log('Anonymous Mode is activated. Search Index will be automatically synced.');
      await this.startSyncIfIndexOutOfSync();

      const every20Minutes = '*/20 * * * *';
      const job = new CronJob(every20Minutes, () => this.startSyncIfIndexOutOfSync());
      this.schedulerRegistry.addCronJob('elasticIndexSync', job);
      job.start();
    }
  }

  async show(): Promise<AssetSyncState | null> {
    try {
      const data = await fs.readFile(assetSyncFile, { encoding: 'utf-8' });
      const state = JSON.parse(data);
      return state;
    } catch (e) {
      if ((e as { code?: string }).code === 'ENOENT') {
        return null;
      }
      throw e;
    }
  }

  async isSyncRunning() {
    return await fs
      .access(assetSyncFile)
      .then(() => true)
      .catch(() => false);
  }

  async start(): Promise<void> {
    if (await this.isSyncRunning()) {
      this.logger.debug('Sync already running.');
      return;
    }

    const writeProgress = (progress: number): Promise<void> => {
      const state: AssetSyncState = { progress: parseFloat(progress.toFixed(3)) };
      const data = JSON.stringify(state);
      return fs.writeFile(assetSyncFile, data, { encoding: 'utf-8' });
    };

    await writeProgress(0);
    setTimeout(async () => {
      await this.assetSearchService.syncWithDatabase(writeProgress);
      await fs.rm(assetSyncFile);
    });
  }

  private async startSyncIfIndexOutOfSync() {
    const numberOfAssets = await this.assetRepo.count();
    const numberOfIndexedAssets = await this.assetSearchService.count();
    this.logger.debug('startSyncIfIndexOutOfSync', { assets: numberOfAssets, indexedAssets: numberOfIndexedAssets });
    if (numberOfAssets !== numberOfIndexedAssets) {
      await this.start();
    }
  }
}

/**
 * The file into which the progress of the current asset sync is written.
 * This allows the sync to be shared across all users and requests without requiring a database entry.
 * Note that the file path is relative to the project root, _not_ to this file.
 */
const assetSyncFile = './asset-sync-progress.tmp.json';

interface AssetSyncState {
  progress: number;
}
