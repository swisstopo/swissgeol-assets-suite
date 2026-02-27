import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AssetRepo } from '@/features/assets/asset.repo';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { AtomicProgressService } from '@/features/assets/sync/atomic-progress.service';

const at2AM = '0 2 * * *';

@Injectable()
export class AssetSyncService extends AtomicProgressService<object> {
  protected override readonly logger = new Logger(AssetSyncService.name);
  protected override readonly syncFile = './asset-sync-progress.tmp.json';

  constructor(
    private readonly assetSearchService: AssetSearchService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly assetRepo: AssetRepo,
  ) {
    super();
  }

  public async startCronJob(): Promise<void> {
    await this.clearSyncFileIfExists();
    await this.startSync();

    if (process.env.ANONYMOUS_MODE === 'true') {
      this.logger.log('Anonymous Mode is activated. Search Index will be automatically synced.');
      await this.startSyncIfIndexOutOfSync();

      const every20Minutes = '*/20 * * * *';
      const job = new CronJob(every20Minutes, () => this.startSyncIfIndexOutOfSync());
      this.schedulerRegistry.addCronJob('elasticIndexSync', job);
      job.start();
    }
  }

  @Cron(at2AM)
  public async syncElasticIndexAfterExternSync() {
    if (process.env.ANONYMOUES_MODE !== 'true') {
      this.logger.log('Starting scheduled sync after external sync');
      await this.clearSyncFileIfExists();
      await this.startSync();
    }
  }

  protected override sync(writeProgress: (progress: number) => Promise<void>): Promise<void> {
    return this.assetSearchService.syncWithDatabase(writeProgress);
  }

  private async startSyncIfIndexOutOfSync() {
    const numberOfAssets = await this.assetRepo.count();
    const numberOfIndexedAssets = await this.assetSearchService.count();
    this.logger.debug('startSyncIfIndexOutOfSync', { assets: numberOfAssets, indexedAssets: numberOfIndexedAssets });
    if (numberOfAssets !== numberOfIndexedAssets) {
      await this.startSync();
    }
  }
}
