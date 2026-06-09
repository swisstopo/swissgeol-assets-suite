import {
  Asset,
  AssetContactRole,
  AssetFileId,
  AssetId,
  AssetSearchResultItem,
  AssetSearchResultItemSchema,
  AssetSearchUsageCode,
  ContactId,
  ElasticsearchFilePage,
  ElasticsearchLocalDate,
  FulltextContent,
  LocalDate,
} from '@asset-sg/shared/v2';
import { transformJsonToFulltextContent } from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import {
  buildFavoritesMap,
  buildGeometryMetadataMap,
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

export class FileSearchWriterService {
  private readonly logger = new Logger(FileSearchWriterService.name);
  private eager?: Promise<SharedEagerData | null>;

  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaClient,
    private readonly geometryRepo: GeometryRepo,
    private readonly geometryDetailRepo: GeometryDetailRepo,
    private readonly options: SearchWriterOptions,
  ) {}

  async clearIndex(): Promise<void> {
    await this.elastic.deleteByQuery({
      index: this.options.index,
      query: { match_all: {} },
      refresh: true,
      ignore_unavailable: true,
    });
  }

  async write(oneOrMore: AssetFileId | AssetFileId[]): Promise<void> {
    const fileIds = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
    if (fileIds.length === 0) {
      return;
    }

    // Fetch file records with their parent asset's metadata.
    const fileRecords = await this.prisma.file.findMany({
      where: { id: { in: fileIds } },
      select: {
        id: true,
        name: true,
        nameAlias: true,
        assetId: true,
        fulltextContent: true,
        asset: {
          select: {
            titlePublic: true,
            titleOriginal: true,
            sgsId: true,
            isPublic: true,
            workgroupId: true,
            assetKindItemCode: true,
            assetFormatItemCode: true,
            createDate: true,
            assetLanguages: { select: { languageItemCode: true } },
            manCatLabelRefs: { select: { manCatLabelItemCode: true } },
            assetContacts: { select: { contactId: true, role: true } },
            ids: { select: { id: true } },
            workflow: { select: { status: true } },
          },
        },
      },
    });

    if (fileRecords.length === 0) {
      return;
    }

    const assetIds = [...new Set(fileRecords.map((f) => f.assetId))];

    // Collect all unique contact IDs across all files' assets.
    const allContactIds = [...new Set(fileRecords.flatMap((f) => f.asset.assetContacts.map((c) => c.contactId)))];

    // Fetch geometry metadata, geometry details, favorites, and contact names for all involved assets.
    const [geometries, geometryDetails, favoriteRecords, contactRecords] = await Promise.all([
      this.geometryRepo.list({ assetIds }),
      this.geometryDetailRepo.list({ assetIds }),
      this.prisma.favorite.findMany({
        where: { assetId: { in: assetIds } },
        select: { assetId: true, userId: true },
      }),
      this.prisma.contact.findMany({
        where: { contactId: { in: allContactIds } },
        select: { contactId: true, name: true },
      }),
    ]);

    const geometryMetadataByAsset = buildGeometryMetadataMap(geometries);
    const favoritesByAsset = buildFavoritesMap(favoriteRecords);

    // Group geometry details by asset ID for building the `data` JSON blob.
    const geometryIdToAssetId = new Map<string, AssetId>();
    for (const g of geometries) {
      geometryIdToAssetId.set(g.id, g.assetId);
    }
    const geometryDetailsByAsset = new Map<AssetId, typeof geometryDetails>();
    for (const detail of geometryDetails) {
      const assetId = geometryIdToAssetId.get(detail.id);
      if (assetId != null) {
        const existing = geometryDetailsByAsset.get(assetId) ?? [];
        existing.push(detail);
        geometryDetailsByAsset.set(assetId, existing);
      }
    }

    const contactNameById = new Map<ContactId, string>();
    for (const { contactId, name } of contactRecords) {
      contactNameById.set(contactId, name);
    }

    // Remove existing ES documents for these files before re-indexing.
    await this.elastic.deleteByQuery({
      index: this.options.index,
      query: { terms: { fileId: fileIds } },
      refresh: false,
      ignore_unavailable: true,
    });

    const operations: Array<BulkOperationContainer | ElasticsearchFilePage> = [];

    for (const file of fileRecords) {
      const pages = transformJsonToFulltextContent(file.fulltextContent);
      if (pages == null || pages.length === 0) {
        continue;
      }

      const asset = file.asset;
      const authorIds = asset.assetContacts.filter((c) => c.role === AssetContactRole.Author).map((c) => c.contactId);
      const contactNames = asset.assetContacts
        .map((c) => contactNameById.get(c.contactId))
        .filter((name): name is string => name !== undefined);
      const languageCodes =
        asset.assetLanguages.length === 0 ? ['None'] : asset.assetLanguages.map((l) => l.languageItemCode);
      const geoMetadata = geometryMetadataByAsset.get(file.assetId);
      const geometryTypes = geoMetadata?.types ?? ['None'];
      const locations = geoMetadata?.locations ?? [];
      const favoredByUserIds = favoritesByAsset.get(file.assetId) ?? [];
      const assetGeometryDetails = geometryDetailsByAsset.get(file.assetId) ?? [];

      const data = JSON.stringify(
        plainToInstance(AssetSearchResultItemSchema, {
          id: file.assetId,
          title: asset.titlePublic,
          isPublic: asset.isPublic,
          kindCode: asset.assetKindItemCode,
          formatCode: asset.assetFormatItemCode,
          topicCodes: asset.manCatLabelRefs.map((m) => m.manCatLabelItemCode),
          contacts: asset.assetContacts.map((c) => ({ id: c.contactId, role: c.role as AssetContactRole })),
          geometries: assetGeometryDetails,
          createdAt: LocalDate.fromDate(asset.createDate),
        } satisfies AssetSearchResultItem),
      );

      for (const page of pages) {
        if (!page.content || page.content.trim().length === 0) {
          continue;
        }
        const docId = `${file.id}_${page.page}`;
        const doc: ElasticsearchFilePage = {
          id: docId,
          fileId: file.id,
          assetId: file.assetId,
          title: asset.titlePublic,
          originalTitle: asset.titleOriginal,
          sgsId: asset.sgsId,
          fileName: file.nameAlias ?? file.name,
          page: page.page,
          content: page.content,
          workgroupId: asset.workgroupId,
          usageCode: asset.isPublic ? AssetSearchUsageCode.Public : AssetSearchUsageCode.Internal,
          kindCode: asset.assetKindItemCode,
          status: asset.workflow?.status ?? 'Draft',
          languageCodes,
          topicCodes: asset.manCatLabelRefs.map((m) => m.manCatLabelItemCode),
          geometryTypes,
          locations,
          authorIds,
          contactNames,
          favoredByUserIds,
          alternativeIds: asset.ids.map((it) => it.id),
          createdAt: LocalDate.fromDate(asset.createDate).toString() as ElasticsearchLocalDate,
          data,
        };
        operations.push({ index: { _index: this.options.index, _id: docId } }, doc);
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

  async writeAssetFiles(oneOrMore: Asset | Asset[]): Promise<void> {
    const assets = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];

    // Remove existing ES documents for these assets to clean up orphaned pages
    // (e.g., when files are removed or page counts decrease).
    const assetIds = assets.map((a) => a.id);
    await this.elastic.deleteByQuery({
      index: this.options.index,
      query: { terms: { assetId: assetIds } },
      refresh: false,
      ignore_unavailable: true,
    });

    const allOperations: Array<BulkOperationContainer | ElasticsearchFilePage> = [];

    const processQueue = new ProcessQueue(QUEUE_SIZE);
    const operationsByAsset: Array<Array<BulkOperationContainer | ElasticsearchFilePage>> = new Array(assets.length);

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      await processQueue.add(async () => {
        try {
          operationsByAsset[i] = await this.mapAssetFilesToElastic(asset);
        } catch (error) {
          this.logger.error('Failed to index files for asset in elastic, skipping', {
            assetId: asset.id,
            assetTitle: asset.title,
            fileIds: asset.files.map((f) => f.id),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
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

    for (const chunk of chunkBulkOperations(allOperations, BULK_CHUNK_SIZE)) {
      await this.elastic.bulk({
        index: this.options.index,
        refresh: this.options.shouldRefresh,
        operations: chunk,
      });
    }
  }

  async deleteByAssetId(assetId: AssetId): Promise<void> {
    await this.elastic.deleteByQuery({
      index: this.options.index,
      query: { term: { assetId: assetId } },
      refresh: true,
    });
  }

  private async mapAssetFilesToElastic(asset: Asset): Promise<Array<BulkOperationContainer | ElasticsearchFilePage>> {
    const operations: Array<BulkOperationContainer | ElasticsearchFilePage> = [];

    const filesWithContent = await this.fetchFulltextContentForAsset(asset);
    if (filesWithContent.length === 0) {
      return operations;
    }

    const eagerData = await this.getEager();
    const authorIds = asset.contacts.filter((it) => it.role === AssetContactRole.Author).map((it) => it.id);
    const [contactNames, favoredByUserIds, geometryMetadata, assetGeometryDetails] = await Promise.all([
      fetchContactNamesForAsset(asset, eagerData, this.prisma),
      fetchFavoredByUserIdsForAsset(asset, eagerData, this.prisma),
      fetchGeometryMetadataForAsset(asset, eagerData, this.geometryRepo),
      this.geometryDetailRepo.list({ assetIds: [asset.id] }),
    ]);
    const languageCodes = asset.languageCodes.length === 0 ? ['None'] : asset.languageCodes;

    const data = JSON.stringify(
      plainToInstance(AssetSearchResultItemSchema, {
        id: asset.id,
        title: asset.title,
        isPublic: asset.isPublic,
        kindCode: asset.kindCode,
        formatCode: asset.formatCode,
        topicCodes: asset.topicCodes,
        contacts: asset.contacts,
        geometries: assetGeometryDetails,
        createdAt: asset.createdAt,
      } satisfies AssetSearchResultItem),
    );

    for (const { fileId, fileName, pages } of filesWithContent) {
      for (const page of pages) {
        if (!page.content || page.content.trim().length === 0) {
          continue;
        }
        const docId = `${fileId}_${page.page}`;
        const doc: ElasticsearchFilePage = {
          id: docId,
          fileId,
          assetId: asset.id,
          title: asset.title,
          originalTitle: asset.originalTitle,
          sgsId: asset.legacyData?.sgsId ?? null,
          fileName,
          page: page.page,
          content: page.content,
          workgroupId: asset.workgroupId,
          usageCode: asset.isPublic ? AssetSearchUsageCode.Public : AssetSearchUsageCode.Internal,
          kindCode: asset.kindCode,
          status: asset.workflowStatus,
          languageCodes,
          topicCodes: asset.topicCodes,
          geometryTypes: geometryMetadata.types,
          locations: geometryMetadata.locations,
          authorIds,
          contactNames,
          favoredByUserIds,
          alternativeIds: asset.identifiers.map((id) => id.value),
          createdAt: asset.createdAt.toString() as ElasticsearchLocalDate,
          data,
        };
        operations.push({ index: { _index: this.options.index, _id: docId } }, doc);
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

    const files = await this.prisma.file.findMany({
      where: {
        id: { in: fileIds },
        fulltextContent: { not: Prisma.AnyNull },
      },
      select: {
        id: true,
        name: true,
        nameAlias: true,
        fulltextContent: true,
      },
    });

    return files
      .filter((f) => f.fulltextContent != null)
      .map((f) => ({
        fileId: f.id,
        fileName: f.nameAlias ?? f.name,
        pages: transformJsonToFulltextContent(f.fulltextContent),
      }));
  }

  private getEager() {
    if (this.eager === undefined && this.options.isEager) {
      this.eager = fetchSharedEagerData(this.prisma, this.geometryRepo);
    }
    return this.eager;
  }
}
