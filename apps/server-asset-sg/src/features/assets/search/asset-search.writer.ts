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
import { PrismaClient } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import {
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

export { SearchWriterOptions as AssetSearchWriterOptions };

export class AssetSearchWriter {
  private readonly eager: Promise<SharedEagerData | null>;

  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaClient,
    private readonly geometryRepo: GeometryRepo,
    private readonly geometryDetailRepo: GeometryDetailRepo,
    private readonly options: SearchWriterOptions,
  ) {
    this.eager = options.isEager ? fetchSharedEagerData(prisma, geometryRepo) : Promise.resolve(null);
  }

  async write(oneOrMore: Asset | Asset[]): Promise<void> {
    const assets = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
    const operations: Array<BulkOperationContainer | ElasticsearchAsset> = Array(assets.length * 2);

    const processQueue = new ProcessQueue(QUEUE_SIZE);
    for (let j = 0; j < assets.length; j++) {
      const i = j;
      const asset = assets[i];
      processQueue
        .add(async () => {
          const elasticAsset = await this.mapAssetToElastic(asset);
          operations[i * 2] = { index: { _index: this.options.index, _id: `${elasticAsset.id}` } };
          operations[i * 2 + 1] = elasticAsset;
        })
        .then();
    }
    await processQueue.waitForIdle();
    await this.elastic.bulk({
      index: this.options.index,
      refresh: this.options.shouldRefresh,
      operations,
    });
  }

  private async mapAssetToElastic(asset: Asset): Promise<ElasticsearchAsset> {
    const eagerData = await this.eager;
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
}
