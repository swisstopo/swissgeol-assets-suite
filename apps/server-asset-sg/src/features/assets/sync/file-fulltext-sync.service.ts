import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { CronJob } from 'cron';
import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileService } from '@/features/assets/files/file.service';
import { FILE_ELASTIC_INDEX } from '@/features/assets/search/asset-search.constants';
import { SearchWriterService } from '@/features/assets/search/search-writer.service';
import { AtomicProgressService } from '@/features/assets/sync/atomic-progress.service';

interface FileFulltextSyncOptions {
  reloadFromS3?: boolean;
}

@Injectable()
export class FileFulltextSyncService extends AtomicProgressService<FileFulltextSyncOptions> {
  protected override readonly logger = new Logger(FileFulltextSyncService.name);
  protected override readonly syncFile = './file-fulltext-sync-progress.tmp.json';

  constructor(
    private readonly searchWriterService: SearchWriterService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly assetRepo: AssetRepo,
    private readonly fileService: FileService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  public async init(): Promise<void> {
    await this.clearSyncFileIfExists();
    await this.startSyncIfIndexOutOfSync();

    if (process.env.ANONYMOUS_MODE === 'true') {
      this.logger.log('Anonymous Mode is activated. Search Index will be automatically synced.');

      const every20Minutes = '*/20 * * * *';
      const job = new CronJob(every20Minutes, () => this.startSyncIfIndexOutOfSync());
      this.schedulerRegistry.addCronJob('elasticFulltextIndexSync', job);
      job.start();
    }
  }

  public async reloadFromS3AndStartSync(): Promise<void> {
    await this.startSync({ reloadFromS3: true });
  }

  protected override async sync(
    writeProgress: (progress: number) => Promise<void>,
    options?: FileFulltextSyncOptions,
  ): Promise<void> {
    if (options?.reloadFromS3) {
      this.logger.log('Starting full text sync with reload from S3');
      await this.fileService.loadAllFulltextContentFromS3((progress: number) => writeProgress(progress * 0.5));
    }

    // Index all files into the file search index.
    const progressOffset = options?.reloadFromS3 ? 0.5 : 0;
    const progressScale = options?.reloadFromS3 ? 0.5 : 1;

    const total = await this.assetRepo.count();
    if (total === 0) {
      this.logger.debug('No assets to index files for');
      await writeProgress(1);
      return;
    }

    const fileWriter = this.searchWriterService.getFileWriter({
      index: FILE_ELASTIC_INDEX,
      isEager: true,
    });

    this.logger.debug('Clearing existing file index before reindexing');
    await fileWriter.clearIndex();

    let offset = 0;
    while (true) {
      const records = await this.assetRepo.list({ limit: 1000, offset });
      if (records.length === 0) {
        break;
      }
      const firstAssetId = records[0].id;
      const lastAssetId = records[records.length - 1].id;
      this.logger.debug('Indexing file fulltext content.', {
        total,
        offset,
        progress: Number((offset / total).toFixed(2)),
        assetIdRange: `${firstAssetId}–${lastAssetId}`,
      });
      try {
        await fileWriter.writeAssetFiles(records);
      } catch (error) {
        this.logger.error('Failed to write file index for batch, continuing with next batch', {
          offset,
          assetIdRange: `${firstAssetId}–${lastAssetId}`,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      offset += records.length;
      await writeProgress(progressOffset + Math.min(offset / total, 1) * progressScale);
    }
    this.logger.debug('Done indexing file fulltext content.', { total });
  }

  private async startSyncIfIndexOutOfSync() {
    // Compare the number of files with fulltext content in DB vs indexed file pages.
    const numberOfFilesWithContent = await this.prismaService.file.count({
      where: { fulltextContent: { not: Prisma.AnyNull } },
    });
    const numberOfIndexedFiles = await this.searchWriterService.countFiles();
    this.logger.debug('startSyncIfIndexOutOfSync', {
      filesWithContent: numberOfFilesWithContent,
      indexedFiles: numberOfIndexedFiles,
    });
    // If numbers don't match, start a sync. Note: this is a rough heuristic since
    // the index stores pages, not files. A full sync will reconcile everything.
    if (numberOfFilesWithContent === 0 && numberOfIndexedFiles === 0) {
      return;
    }
    if (numberOfIndexedFiles === 0 && numberOfFilesWithContent > 0) {
      await this.startSync();
    }
  }
}
