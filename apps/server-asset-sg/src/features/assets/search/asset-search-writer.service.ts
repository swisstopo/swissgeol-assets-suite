import {
  Asset,
  AssetContactRole,
  AssetSearchResultItem,
  AssetSearchResultItemSchema,
  AssetSearchUsageCode,
  ElasticsearchAsset,
  ElasticsearchLocalDate,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import {
  chunkBulkOperations,
  fetchContactNamesForAsset,
  fetchFavoredByUserIdsForAsset,
  fetchGeometryMetadataForAsset,
  fetchSharedEagerData,
  SearchWriterOptions,
  SharedEagerData,
} from '@/features/assets/search/search-writer.utils';
import { GeometryDetailRepo } from '@/features/geometries/geometry-detail.repo';
import { GeometryRepo } from '@/features/geometries/geometry.repo';
import { ProcessQueue } from '@/utils/process-queue';

const QUEUE_SIZE = 10;
const BULK_CHUNK_SIZE = 200;

export class AssetSearchWriterService {
  private readonly logger = new Logger(AssetSearchWriterService.name);
  private eager?: Promise<SharedEagerData | null>;

  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaClient,
    private readonly geometryRepo: GeometryRepo,
    private readonly geometryDetailRepo: GeometryDetailRepo,
    private readonly options: SearchWriterOptions,
  ) {}

  async write(oneOrMore: Asset | Asset[]): Promise<void> {
    const assets = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
    const operations: Array<BulkOperationContainer | ElasticsearchAsset> = [];

    const processQueue = new ProcessQueue(QUEUE_SIZE);
    const operationsByAsset: Array<[BulkOperationContainer, ElasticsearchAsset] | undefined> = new Array(assets.length);

    for (let j = 0; j < assets.length; j++) {
      const i = j;
      const asset = assets[i];
      await processQueue.add(async () => {
        try {
          const elasticAsset = await this.mapAssetToElastic(asset);
          operationsByAsset[i] = [{ index: { _index: this.options.index, _id: `${elasticAsset.id}` } }, elasticAsset];
        } catch (error) {
          this.logger.error('Failed to map asset to elastic, skipping', {
            assetId: asset.id,
            assetTitle: asset.title,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    }
    await processQueue.waitForIdle();

    for (const ops of operationsByAsset) {
      if (ops != null) {
        operations.push(...ops);
      }
    }

    if (operations.length === 0) {
      return;
    }

    for (const chunk of chunkBulkOperations(operations, BULK_CHUNK_SIZE)) {
      await this.elastic.bulk({
        index: this.options.index,
        refresh: this.options.shouldRefresh,
        operations: chunk,
      });
    }
  }

  private async mapAssetToElastic(asset: Asset): Promise<ElasticsearchAsset> {
    const eagerData = await this.getEager();
    const [contactNames, favoredByUserIds, geometryMetadata, geometries] = await Promise.all([
      fetchContactNamesForAsset(asset, eagerData, this.prisma),
      fetchFavoredByUserIdsForAsset(asset, eagerData, this.prisma),
      fetchGeometryMetadataForAsset(asset, eagerData, this.geometryRepo),
      this.geometryDetailRepo.list({ assetIds: [asset.id] }),
    ]);

    const languageCodes = asset.languageCodes.length === 0 ? ['None'] : asset.languageCodes;

    return {
      id: asset.id,
      status: asset.workflowStatus,
      alternativeIds: asset.identifiers.map((id) => id.value),
      title: asset.title,
      originalTitle: asset.originalTitle,
      sgsId: asset.legacyData?.sgsId ?? null,
      createdAt: asset.createdAt.toString() as ElasticsearchLocalDate,
      usageCode: asset.isPublic ? AssetSearchUsageCode.Public : AssetSearchUsageCode.Internal,
      kindCode: asset.kindCode,
      languageCodes,
      authorIds: asset.contacts.filter((it) => it.role === AssetContactRole.Author).map((it) => it.id),
      contactNames,
      topicCodes: asset.topicCodes,
      geometryTypes: geometryMetadata.types,
      locations: geometryMetadata.locations,
      workgroupId: asset.workgroupId,
      favoredByUserIds,
      data: JSON.stringify(
        plainToInstance(AssetSearchResultItemSchema, {
          id: asset.id,
          title: asset.title,
          isPublic: asset.isPublic,
          kindCode: asset.kindCode,
          formatCode: asset.formatCode,
          topicCodes: asset.topicCodes,
          contacts: asset.contacts,
          geometries,
          createdAt: asset.createdAt,
        } satisfies AssetSearchResultItem),
      ),
    };
  }

  private getEager() {
    if (this.eager === undefined && this.options.isEager) {
      this.eager = fetchSharedEagerData(this.prisma, this.geometryRepo);
    }
    return this.eager;
  }
}
