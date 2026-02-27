import {
  Asset,
  AssetContactRole,
  AssetId,
  AssetSearchUsageCode,
  ElasticsearchFile,
  ElasticsearchLocalDate,
  FulltextContent,
  GeometryType,
  UserId,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { PrismaClient } from '@prisma/client';
import { GeometryRepo } from '@/features/geometries/geometry.repo';
import { ProcessQueue } from '@/utils/process-queue';

const QUEUE_SIZE = 10;

export interface FileSearchWriterOptions {
  index: string;
  shouldRefresh?: boolean;
  isEager?: boolean;
}

export class FileSearchWriter {
  private readonly eager: Promise<FileEager | null>;

  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaClient,
    private readonly geometryRepo: GeometryRepo,
    private readonly options: FileSearchWriterOptions,
  ) {
    this.eager = options.isEager ? this.fetchEager() : Promise.resolve(null);
  }

  async write(oneOrMore: Asset | Asset[]): Promise<void> {
    const assets = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
    const allOperations: Array<BulkOperationContainer | ElasticsearchFile> = [];

    const processQueue = new ProcessQueue(QUEUE_SIZE);
    const operationsByAsset: Array<Array<BulkOperationContainer | ElasticsearchFile>> = Array(assets.length);

    for (let j = 0; j < assets.length; j++) {
      const i = j;
      const asset = assets[i];
      processQueue
        .add(async () => {
          operationsByAsset[i] = await this.mapAssetFilesToElastic(asset);
        })
        .then();
    }
    await processQueue.waitForIdle();

    for (const ops of operationsByAsset) {
      if (ops != null) {
        allOperations.push(...ops);
      }
    }

    if (allOperations.length === 0) {
      return;
    }

    await this.elastic.bulk({
      index: this.options.index,
      refresh: this.options.shouldRefresh,
      operations: allOperations,
    });
  }

  async deleteByAssetId(assetId: AssetId): Promise<void> {
    await this.elastic.deleteByQuery({
      index: this.options.index,
      query: { term: { assetId: assetId } },
      refresh: true,
    });
  }

  private async mapAssetFilesToElastic(asset: Asset): Promise<Array<BulkOperationContainer | ElasticsearchFile>> {
    const operations: Array<BulkOperationContainer | ElasticsearchFile> = [];

    // Fetch fulltext content for all files of this asset
    const filesWithContent = await this.fetchFulltextContentForAsset(asset);
    if (filesWithContent.length === 0) {
      return operations;
    }

    // Fetch shared asset metadata
    const authorIds = asset.contacts.filter((it) => it.role === AssetContactRole.Author).map((it) => it.id);
    const languageCodes = asset.languageCodes.length === 0 ? ['None'] : asset.languageCodes;
    const geometryTypes = await this.fetchGeometryTypesForAsset(asset);
    const favoredByUserIds = await this.fetchFavoredByUserIdsForAsset(asset);

    for (const { fileId, fileName, pages } of filesWithContent) {
      for (const page of pages) {
        if (!page.content || page.content.trim().length === 0) {
          continue;
        }
        const docId = `${fileId}_${page.page}`;
        const doc: ElasticsearchFile = {
          fileId,
          assetId: asset.id,
          assetTitle: asset.title,
          fileName,
          page: page.page,
          content: page.content,
          workgroupId: asset.workgroupId,
          usageCode: asset.isPublic ? AssetSearchUsageCode.Public : AssetSearchUsageCode.Internal,
          kindCode: asset.kindCode,
          status: asset.workflowStatus,
          languageCodes,
          topicCodes: asset.topicCodes,
          geometryTypes,
          authorIds,
          favoredByUserIds,
          createdAt: asset.createdAt.toString() as ElasticsearchLocalDate,
        };
        operations.push({ index: { _index: this.options.index, _id: docId } });
        operations.push(doc);
      }
    }

    return operations;
  }

  private async fetchFulltextContentForAsset(
    asset: Asset,
  ): Promise<Array<{ fileId: number; fileName: string; pages: FulltextContent[] }>> {
    const fileIds = asset.files.map((f) => f.id);
    if (fileIds.length === 0) {
      return [];
    }

    const eager = await this.eager;
    if (eager !== null) {
      const results: Array<{ fileId: number; fileName: string; pages: FulltextContent[] }> = [];
      for (const fileId of fileIds) {
        const entry = eager.fileIdToFulltextContent.get(fileId);
        if (entry != null && entry.pages.length > 0) {
          results.push({ fileId, fileName: entry.fileName, pages: entry.pages });
        }
      }
      return results;
    }

    const files = await queryFilesWithFulltextByIds(this.prisma, fileIds);

    return files
      .filter((f) => f.fulltextContent != null)
      .map((f) => ({
        fileId: f.id,
        fileName: f.nameAlias ?? f.name,
        pages: f.fulltextContent as FulltextContent[],
      }));
  }

  private async fetchGeometryTypesForAsset(asset: Asset): Promise<GeometryType[] | ['None']> {
    const eager = await this.eager;
    if (eager !== null) {
      return eager.assetIdToGeometryTypes.get(asset.id) ?? ['None'];
    }
    const geometries = await this.geometryRepo.list({ assetIds: [asset.id] });
    if (geometries.length === 0) {
      return ['None'];
    }
    const types = new Set<GeometryType>();
    for (const geometry of geometries) {
      types.add(geometry.type);
    }
    return [...types];
  }

  private async fetchFavoredByUserIdsForAsset(asset: Asset): Promise<string[]> {
    const eager = await this.eager;
    if (eager !== null) {
      return eager.assetIdToFavoredByUserId.get(asset.id) ?? [];
    }
    const favoredByUsers = await this.prisma.assetUser.findMany({
      select: { id: true },
      where: { favorites: { some: { assetId: asset.id } } },
    });
    return favoredByUsers.map(({ id }) => id);
  }

  private async fetchEager(): Promise<FileEager> {
    const [fulltextContent, favorites, geometryTypes] = await Promise.all([
      this.fetchEagerFulltextContent(),
      this.fetchEagerFavorites(),
      this.fetchEagerGeometryTypes(),
    ] as const);
    return {
      fileIdToFulltextContent: fulltextContent,
      assetIdToFavoredByUserId: favorites,
      assetIdToGeometryTypes: geometryTypes,
    };
  }

  private async fetchEagerFulltextContent(): Promise<Map<number, { fileName: string; pages: FulltextContent[] }>> {
    const files = await queryFilesWithFulltext(this.prisma);
    const mapping = new Map<number, { fileName: string; pages: FulltextContent[] }>();
    for (const file of files) {
      if (file.fulltextContent != null) {
        mapping.set(file.id, {
          fileName: file.nameAlias ?? file.name,
          pages: file.fulltextContent as FulltextContent[],
        });
      }
    }
    return mapping;
  }

  private async fetchEagerFavorites(): Promise<Map<AssetId, UserId[]>> {
    const favorites = await this.prisma.favorite.findMany({
      select: { assetId: true, userId: true },
    });
    const mapping = new Map<AssetId, UserId[]>();
    for (const { assetId, userId } of favorites) {
      const userIds = mapping.get(assetId);
      if (userIds === undefined) {
        mapping.set(assetId, [userId]);
      } else {
        userIds.push(userId);
      }
    }
    return mapping;
  }

  private async fetchEagerGeometryTypes(): Promise<Map<AssetId, GeometryType[] | ['None']>> {
    const geometries = await this.geometryRepo.list({});
    const mapping = new Map<AssetId, Set<GeometryType>>();
    for (const geometry of geometries) {
      if (!mapping.has(geometry.assetId)) {
        mapping.set(geometry.assetId, new Set());
      }
      mapping.get(geometry.assetId)!.add(geometry.type);
    }
    const result = new Map<AssetId, GeometryType[] | ['None']>();
    for (const [assetId, types] of mapping) {
      result.set(assetId, types.size > 0 ? [...types] : ['None']);
    }
    return result;
  }
}

interface FileEager {
  fileIdToFulltextContent: Map<number, { fileName: string; pages: FulltextContent[] }>;
  assetIdToFavoredByUserId: Map<AssetId, UserId[]>;
  assetIdToGeometryTypes: Map<AssetId, GeometryType[] | ['None']>;
}

interface FileWithFulltext {
  id: number;
  name: string;
  nameAlias: string | null;
  fulltextContent: unknown;
}

/**
 * Queries all files that have fulltext content.
 * Isolated into a standalone function to avoid Prisma type inference issues
 * with the `fulltextContent` Json field.
 */

async function queryFilesWithFulltext(prisma: PrismaClient): Promise<FileWithFulltext[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await prisma.$queryRawUnsafe(`
    SELECT id, name, name_alias AS "nameAlias", fulltext_content AS "fulltextContent"
    FROM file
    WHERE fulltext_content IS NOT NULL
  `);
  return result as FileWithFulltext[];
}

/**
 * Queries files with fulltext content filtered by file ids.
 */
async function queryFilesWithFulltextByIds(prisma: PrismaClient, fileIds: number[]): Promise<FileWithFulltext[]> {
  if (fileIds.length === 0) {
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await prisma.$queryRawUnsafe(
    `SELECT id, name, name_alias AS "nameAlias", fulltext_content AS "fulltextContent"
     FROM file
     WHERE fulltext_content IS NOT NULL AND id = ANY($1)`,
    fileIds,
  );
  return result as FileWithFulltext[];
}
