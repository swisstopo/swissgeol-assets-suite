import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileService } from '@/features/assets/files/file.service';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { AtomicProgressService } from '@/features/assets/sync/atomic-progress.service';

@Injectable()
export class FileFulltextSyncService extends AtomicProgressService {
  protected override readonly logger = new Logger(FileFulltextSyncService.name);
  protected override readonly syncFile = './file-fulltext-sync-progress.tmp.json';

  private reloadFromS3 = false;

  constructor(
    private readonly assetSearchService: AssetSearchService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly assetRepo: AssetRepo,
    private readonly fileService: FileService,
  ) {
    super();
  }

  public async init(): Promise<void> {
    await this.clearSyncFileIfExists();

    if (process.env.ANONYMOUS_MODE === 'true') {
      this.logger.log('Anonymous Mode is activated. Search Index will be automatically synced.');
      // TODO: This trigger depends on the way we implement the index.
      await this.startSyncIfIndexOutOfSync();

      const every20Minutes = '*/20 * * * *';
      const job = new CronJob(every20Minutes, () => this.startSyncIfIndexOutOfSync());
      this.schedulerRegistry.addCronJob('elasticFulltextIndexSync', job);
      job.start();
    }
  }

  public async reloadFromS3AndStartSync(): Promise<void> {
    this.reloadFromS3 = true;
    await this.startSync();
  }

  protected override async sync(writeProgress: (progress: number) => Promise<void>): Promise<void> {
    if (this.reloadFromS3) {
      this.logger.log('Starting full text sync with reload from S3');
      await this.fileService.loadAllFulltextContentFromS3((progress: number) => writeProgress(progress * 0.5));
    }

    // TODO: Implement indexing.
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
