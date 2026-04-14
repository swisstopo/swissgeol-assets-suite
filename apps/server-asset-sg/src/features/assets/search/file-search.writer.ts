import {
  Asset,
  AssetContactRole,
  AssetFile,
  AssetId,
  AssetSearchUsageCode,
  ContactId,
  ElasticsearchFilePage,
  ElasticsearchLocalDate,
  ElasticsearchPoint,
  FulltextContent,
  GeometryType,
  LocalDate,
  UserId,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { mapLv95ToElastic } from '@/features/assets/search/asset-search.utils';
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

  async write(oneOrMore: AssetFile | AssetFile[]): Promise<void> {
    const files = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
    if (files.length === 0) {
      return;
    }

    const fileIds = files.map((f) => f.id);

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

    // Fetch geometry metadata, favorites, and contact names for all involved assets.
    const [geometries, favoriteRecords, contactRecords] = await Promise.all([
      this.geometryRepo.list({ assetIds }),
      this.prisma.favorite.findMany({
        where: { assetId: { in: assetIds } },
        select: { assetId: true, userId: true },
      }),
      this.prisma.contact.findMany({
        where: { contactId: { in: allContactIds } },
        select: { contactId: true, name: true },
      }),
    ]);

    const geometryMetadataByAsset = new Map<AssetId, GeometryMetadata>();
    for (const geo of geometries) {
      let metadata = geometryMetadataByAsset.get(geo.assetId);
      if (metadata == null) {
        metadata = { types: new Set(), locations: [] };
        geometryMetadataByAsset.set(geo.assetId, metadata);
      }
      metadata.types.add(geo.type);
      metadata.locations.push(mapLv95ToElastic(geo.center));
    }

    const favoritesByAsset = new Map<AssetId, UserId[]>();
    for (const { assetId, userId } of favoriteRecords) {
      const userIds = favoritesByAsset.get(assetId);
      if (userIds === undefined) {
        favoritesByAsset.set(assetId, [userId]);
      } else {
        userIds.push(userId);
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
      const pages = file.fulltextContent as unknown as FulltextContent[] | null;
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
      const geometryTypes: GeometryType[] | ['None'] =
        geoMetadata != null && geoMetadata.types.size > 0 ? [...geoMetadata.types] : ['None'];
      const locations = geoMetadata?.locations ?? [];
      const favoredByUserIds = favoritesByAsset.get(file.assetId) ?? [];

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
        };
        operations.push({ index: { _index: this.options.index, _id: docId } });
        operations.push(doc);
      }
    }

    if (operations.length === 0) {
      return;
    }

    await this.elastic.bulk({
      index: this.options.index,
      refresh: this.options.shouldRefresh,
      operations,
    });
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
    const operationsByAsset: Array<Array<BulkOperationContainer | ElasticsearchFilePage>> = Array(assets.length);

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

  private async mapAssetFilesToElastic(asset: Asset): Promise<Array<BulkOperationContainer | ElasticsearchFilePage>> {
    const operations: Array<BulkOperationContainer | ElasticsearchFilePage> = [];

    // Fetch fulltext content for all files of this asset
    const filesWithContent = await this.fetchFulltextContentForAsset(asset);
    if (filesWithContent.length === 0) {
      return operations;
    }

    // Fetch shared asset metadata
    const authorIds = asset.contacts.filter((it) => it.role === AssetContactRole.Author).map((it) => it.id);
    const contactNames = await this.fetchContactNamesForAsset(asset);
    const languageCodes = asset.languageCodes.length === 0 ? ['None'] : asset.languageCodes;
    const geometryMetadata = await this.fetchGeometryMetadataForAsset(asset);
    const favoredByUserIds = await this.fetchFavoredByUserIdsForAsset(asset);

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
        pages: f.fulltextContent as unknown as FulltextContent[],
      }));
  }

  private async fetchGeometryMetadataForAsset(
    asset: Asset,
  ): Promise<{ types: GeometryType[] | ['None']; locations: ElasticsearchPoint[] }> {
    const eager = await this.eager;
    if (eager !== null) {
      return eager.assetIdToGeometryMetadata.get(asset.id) ?? { types: ['None'], locations: [] };
    }
    const geometries = await this.geometryRepo.list({ assetIds: [asset.id] });
    if (geometries.length === 0) {
      return { types: ['None'], locations: [] };
    }
    const types = new Set<GeometryType>();
    const locations: ElasticsearchPoint[] = [];
    for (const geometry of geometries) {
      types.add(geometry.type);
      locations.push(mapLv95ToElastic(geometry.center));
    }
    return { types: [...types], locations };
  }

  private async fetchContactNamesForAsset(asset: Asset): Promise<string[]> {
    const eager = await this.eager;
    if (eager !== null) {
      const names: string[] = [];
      for (const contact of asset.contacts) {
        const name = eager.contactIdToName.get(contact.id);
        if (name !== undefined) {
          names.push(name);
        }
      }
      return names;
    }
    const contacts = await this.prisma.contact.findMany({
      select: { name: true },
      where: { contactId: { in: asset.contacts.map((it) => it.id) } },
    });
    return contacts.map((it) => it.name);
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
    const [fulltextContent, favorites, geometryMetadata, contactNames] = await Promise.all([
      this.fetchEagerFulltextContent(),
      this.fetchEagerFavorites(),
      this.fetchEagerGeometryMetadata(),
      this.fetchEagerContactNames(),
    ] as const);
    return {
      fileIdToFulltextContent: fulltextContent,
      assetIdToFavoredByUserId: favorites,
      assetIdToGeometryMetadata: geometryMetadata,
      contactIdToName: contactNames,
    };
  }

  private async fetchEagerFulltextContent(): Promise<Map<number, { fileName: string; pages: FulltextContent[] }>> {
    const files = await this.prisma.file.findMany({
      where: { fulltextContent: { not: Prisma.AnyNull } },
      select: {
        id: true,
        name: true,
        nameAlias: true,
        fulltextContent: true,
      },
    });
    const mapping = new Map<number, { fileName: string; pages: FulltextContent[] }>();
    for (const file of files) {
      if (file.fulltextContent != null) {
        mapping.set(file.id, {
          fileName: file.nameAlias ?? file.name,
          pages: file.fulltextContent as unknown as FulltextContent[],
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

  private async fetchEagerGeometryMetadata(): Promise<
    Map<AssetId, { types: GeometryType[] | ['None']; locations: ElasticsearchPoint[] }>
  > {
    const geometries = await this.geometryRepo.list({});
    const mapping = new Map<AssetId, { types: Set<GeometryType>; locations: ElasticsearchPoint[] }>();
    for (const geometry of geometries) {
      if (!mapping.has(geometry.assetId)) {
        mapping.set(geometry.assetId, { types: new Set(), locations: [] });
      }
      const entry = mapping.get(geometry.assetId)!;
      entry.types.add(geometry.type);
      entry.locations.push(mapLv95ToElastic(geometry.center));
    }
    const result = new Map<AssetId, { types: GeometryType[] | ['None']; locations: ElasticsearchPoint[] }>();
    for (const [assetId, { types, locations }] of mapping) {
      result.set(assetId, { types: types.size > 0 ? [...types] : ['None'], locations });
    }
    return result;
  }

  private async fetchEagerContactNames(): Promise<Map<ContactId, string>> {
    const contacts = await this.prisma.contact.findMany({
      select: { contactId: true, name: true },
    });
    const mapping = new Map<ContactId, string>();
    for (const { contactId, name } of contacts) {
      mapping.set(contactId, name);
    }
    return mapping;
  }
}

interface FileEager {
  fileIdToFulltextContent: Map<number, { fileName: string; pages: FulltextContent[] }>;
  assetIdToFavoredByUserId: Map<AssetId, UserId[]>;
  assetIdToGeometryMetadata: Map<AssetId, { types: GeometryType[] | ['None']; locations: ElasticsearchPoint[] }>;
  contactIdToName: Map<ContactId, string>;
}

interface GeometryMetadata {
  types: Set<GeometryType>;
  locations: ElasticsearchPoint[];
}
