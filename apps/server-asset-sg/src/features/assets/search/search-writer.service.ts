import { Asset, AssetId } from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Injectable, Logger } from '@nestjs/common';

// eslint-disable-next-line @nx/enforce-module-boundaries
import indexMapping from '../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_asset.json';
// eslint-disable-next-line @nx/enforce-module-boundaries
import fileIndexMapping from '../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_file.json';

import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { AssetSearchWriterService } from '@/features/assets/search/asset-search-writer.service';
import { ASSET_ELASTIC_INDEX, FILE_ELASTIC_INDEX } from '@/features/assets/search/asset-search.constants';
import { FileSearchWriterService } from '@/features/assets/search/file-search-writer.service';
import { getDateTimeString } from '@/features/assets/search/search-query.utils';
import { SearchWriterOptions } from '@/features/assets/search/search-writer.utils';
import { GeometryDetailRepo } from '@/features/geometries/geometry-detail.repo';
import { GeometryRepo } from '@/features/geometries/geometry.repo';

@Injectable()
export class SearchWriterService {
  private readonly logger = new Logger(SearchWriterService.name);

  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaService,
    private readonly assetRepo: AssetRepo,
    private readonly geometryRepo: GeometryRepo,
    private readonly geometryDetailRepo: GeometryDetailRepo,
  ) {}

  async register(asset: Asset): Promise<void> {
    await Promise.all([this.getAssetWriter().write(asset), this.getFileWriter().writeAssetFiles(asset)]);
  }

  getAssetWriter(options?: SearchWriterOptions): AssetSearchWriterService {
    return new AssetSearchWriterService(
      this.elastic,
      this.prisma,
      this.geometryRepo,
      this.geometryDetailRepo,
      options ?? { index: ASSET_ELASTIC_INDEX, shouldRefresh: true },
    );
  }

  getFileWriter(options?: SearchWriterOptions): FileSearchWriterService {
    return new FileSearchWriterService(
      this.elastic,
      this.prisma,
      this.geometryRepo,
      this.geometryDetailRepo,
      options ?? { index: FILE_ELASTIC_INDEX, shouldRefresh: true },
    );
  }

  async deleteFromIndex(assetId: AssetId): Promise<void> {
    await Promise.all([
      this.elastic.delete({
        index: ASSET_ELASTIC_INDEX,
        id: `${assetId}`,
        refresh: true,
      }),
      this.elastic.deleteByQuery({
        index: FILE_ELASTIC_INDEX,
        query: { term: { assetId: assetId } },
        refresh: true,
        ignore_unavailable: true,
      }),
    ]);
  }

  async count(): Promise<number> {
    return (await this.elastic.count({ index: ASSET_ELASTIC_INDEX, ignore_unavailable: true })).count;
  }

  async countFiles(): Promise<number> {
    return (await this.elastic.count({ index: FILE_ELASTIC_INDEX, ignore_unavailable: true })).count;
  }

  async syncWithDatabase(onProgress?: (percentage: number) => void | Promise<void>): Promise<void> {
    // Write all Prisma assets into the sync index.
    const total = await this.prisma.asset.count();
    if (total === 0) {
      this.logger.debug('No assets to sync');
      if (onProgress != null) {
        onProgress(1);
      }
      return;
    }

    // Initialize temporary sync indices.
    const SYNC_INDEX = `sync-${ASSET_ELASTIC_INDEX}-${getDateTimeString()}`;
    const FILE_SYNC_INDEX = `sync-${FILE_ELASTIC_INDEX}-${getDateTimeString()}`;
    const existsSyncIndex = await this.elastic.indices.exists({ index: SYNC_INDEX });
    if (existsSyncIndex) {
      throw new Error(`can't sync to '${SYNC_INDEX}', index already exists`);
    }
    const existsFileSyncIndex = await this.elastic.indices.exists({ index: FILE_SYNC_INDEX });
    if (existsFileSyncIndex) {
      throw new Error(`can't sync to '${FILE_SYNC_INDEX}', index already exists`);
    }

    try {
      await this.elastic.indices.create({ index: SYNC_INDEX });
      await this.elastic.indices.putMapping({ index: SYNC_INDEX, ...indexMapping });

      await this.elastic.indices.create({ index: FILE_SYNC_INDEX });
      await this.elastic.indices.putMapping({ index: FILE_SYNC_INDEX, ...fileIndexMapping });

      const writer = this.getAssetWriter({ index: SYNC_INDEX, isEager: true });
      const fileWriter = this.getFileWriter({ index: FILE_SYNC_INDEX, isEager: true });
      let offset = 0;
      while (true) {
        this.logger.debug('Syncing assets.', {
          total,
          offset,
          progress: Number((offset / total).toFixed(2)),
        });
        const records = await this.assetRepo.list({ limit: 1000, offset });
        if (records.length === 0) {
          break;
        }
        try {
          await Promise.all([writer.write(records), fileWriter.writeAssetFiles(records)]);
        } catch (error) {
          this.logger.error('Failed to sync batch, continuing with next batch', {
            offset,
            batchSize: records.length,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        offset += records.length;
        if (onProgress != null) {
          await onProgress(Math.min(offset / total, 1));
        }
      }
      this.logger.debug('Done syncing assets.', { total });

      // Delete existing indices and recreate them.
      await this.elastic.indices.delete({ index: ASSET_ELASTIC_INDEX, ignore_unavailable: true });
      await this.elastic.indices.create({ index: ASSET_ELASTIC_INDEX });
      await this.elastic.indices.putMapping({ index: ASSET_ELASTIC_INDEX, ...indexMapping });

      await this.elastic.indices.delete({ index: FILE_ELASTIC_INDEX, ignore_unavailable: true });
      await this.elastic.indices.create({ index: FILE_ELASTIC_INDEX });
      await this.elastic.indices.putMapping({ index: FILE_ELASTIC_INDEX, ...fileIndexMapping });

      // Refresh and reindex sync indices into live indices.
      // Use wait_for_completion: false to avoid client/server timeouts on large datasets,
      // then poll the task until it completes.
      await this.elastic.indices.refresh({ index: SYNC_INDEX });
      await this.waitForReindex(SYNC_INDEX, ASSET_ELASTIC_INDEX);
      await this.elastic.indices.refresh({ index: ASSET_ELASTIC_INDEX });

      await this.elastic.indices.refresh({ index: FILE_SYNC_INDEX });
      await this.waitForReindex(FILE_SYNC_INDEX, FILE_ELASTIC_INDEX);
      await this.elastic.indices.refresh({ index: FILE_ELASTIC_INDEX });
    } catch (error) {
      this.logger.error('Failed to sync search index with database', error);
      throw error;
    } finally {
      await this.elastic.indices.delete({ index: SYNC_INDEX }).catch((e) => {
        this.logger.error('Failed to delete sync index', { index: SYNC_INDEX, error: e });
      });
      await this.elastic.indices.delete({ index: FILE_SYNC_INDEX }).catch((e) => {
        this.logger.error('Failed to delete file sync index', { index: FILE_SYNC_INDEX, error: e });
      });
    }
  }

  /**
   * Starts a reindex operation asynchronously and polls until it completes.
   * This avoids HTTP timeouts on large datasets.
   */
  private async waitForReindex(sourceIndex: string, destIndex: string): Promise<void> {
    const POLL_INTERVAL_MS = 5_000;
    const response = await this.elastic.reindex({
      source: { index: sourceIndex },
      dest: { index: destIndex },
      wait_for_completion: false,
    });
    const taskId = response.task as string;
    this.logger.debug('Reindex task started', { sourceIndex, destIndex, taskId });

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const taskResponse = await this.elastic.tasks.get({ task_id: taskId });
      if (taskResponse.completed) {
        const failures = taskResponse.response?.failures ?? [];
        if (failures.length > 0) {
          this.logger.error('Reindex completed with failures', { sourceIndex, destIndex, failures });
        }
        this.logger.debug('Reindex task completed', {
          sourceIndex,
          destIndex,
          total: taskResponse.response?.total,
          created: taskResponse.response?.created,
        });
        return;
      }
    }
  }
}
