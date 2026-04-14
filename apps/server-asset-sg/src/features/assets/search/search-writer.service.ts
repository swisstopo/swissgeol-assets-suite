import { Asset, AssetId } from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Injectable, Logger } from '@nestjs/common';

// eslint-disable-next-line @nx/enforce-module-boundaries
import indexMapping from '../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_asset.json';
// eslint-disable-next-line @nx/enforce-module-boundaries
import fileIndexMapping from '../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_file.json';

import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { ASSET_ELASTIC_INDEX, FILE_ELASTIC_INDEX } from '@/features/assets/search/asset-search.constants';
import { AssetSearchWriter, AssetSearchWriterOptions } from '@/features/assets/search/asset-search.writer';
import { FileSearchWriter, FileSearchWriterOptions } from '@/features/assets/search/file-search.writer';
import { getDateTimeString } from '@/features/assets/search/search-query.utils';
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
    await Promise.all([this.getWriter().write(asset), this.getFileWriter().writeAssetFiles(asset)]);
  }

  getWriter(options?: AssetSearchWriterOptions): AssetSearchWriter {
    return new AssetSearchWriter(
      this.elastic,
      this.prisma,
      this.geometryRepo,
      this.geometryDetailRepo,
      options ?? { index: ASSET_ELASTIC_INDEX, shouldRefresh: true },
    );
  }

  getFileWriter(options?: FileSearchWriterOptions): FileSearchWriter {
    return new FileSearchWriter(
      this.elastic,
      this.prisma,
      this.geometryRepo,
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

    await this.elastic.indices.create({ index: SYNC_INDEX });
    await this.elastic.indices.putMapping({ index: SYNC_INDEX, ...indexMapping });

    await this.elastic.indices.create({ index: FILE_SYNC_INDEX });
    await this.elastic.indices.putMapping({ index: FILE_SYNC_INDEX, ...fileIndexMapping });

    const writer = this.getWriter({ index: SYNC_INDEX, isEager: true });
    const fileWriter = this.getFileWriter({ index: FILE_SYNC_INDEX, isEager: true });
    let offset = 0;
    for (;;) {
      this.logger.debug('Syncing assets.', {
        total,
        offset,
        progress: Number((offset / total).toFixed(2)),
      });
      const records = await this.assetRepo.list({ limit: 1000, offset });
      if (records.length === 0) {
        break;
      }
      await Promise.all([writer.write(records), fileWriter.writeAssetFiles(records)]);
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
    await this.elastic.indices.refresh({ index: SYNC_INDEX });
    await this.elastic.reindex({
      source: { index: SYNC_INDEX },
      dest: { index: ASSET_ELASTIC_INDEX },
    });
    await this.elastic.indices.refresh({ index: ASSET_ELASTIC_INDEX });
    await this.elastic.indices.delete({ index: SYNC_INDEX });

    await this.elastic.indices.refresh({ index: FILE_SYNC_INDEX });
    await this.elastic.reindex({
      source: { index: FILE_SYNC_INDEX },
      dest: { index: FILE_ELASTIC_INDEX },
    });
    await this.elastic.indices.refresh({ index: FILE_ELASTIC_INDEX });
    await this.elastic.indices.delete({ index: FILE_SYNC_INDEX });
  }
}
