import { getHeapStatistics } from 'v8';
import { Prisma, PrismaClient } from '@prisma/client';
import { SyncConfig } from './config';
import { log } from './log';

/**
 * Contains all attributes that should be published, _except_ the geometries which need to be merged manually due to
 * missing PostGIS support in Prisma.
 *
 * Note: files are intentionally *not* selected here. They are exported separately in a bounded, chunked fashion by
 * {@link ExportToViewService.exportFiles} to avoid holding the large JSON columns (`fulltextContent`,
 * `pageRangeClassifications`, `pageDimensions`) of every file of a whole asset batch in memory at once.
 */
type PublishedAssetSelection = Prisma.AssetGetPayload<{
  select: {
    assetId: true;
    titlePublic: true;
    isExtract: true;
    createDate: true;
    receiptDate: true;
    assetContacts: true;
    isNatRel: true;
    assetKindItemCode: true;
    assetFormatItemCode: true;
    workgroupId: true;
    isPublic: true;
    assetMainId: true;
    sgsId: true;
    geolDataInfo: true;
    geolAuxDataInfo: true;
    geolContactDataInfo: true;
    municipality: true;
  };
}>;

interface AssetInfo {
  assetId: number;
  workgroupId: number;
  publishData: {
    authors: boolean;
    initiators: boolean;
    suppliers: boolean;
    general: boolean;
    geometries: boolean;
    legacy: boolean;
    normalFiles: boolean;
    legalFiles: boolean;
    references: boolean;
  };
}

const BATCH_SIZE = 100;
const BATCH_SIZE_GEOMETRIES = 10_000;

/**
 * Number of full file rows (including their large JSON columns) fetched, transformed and inserted per iteration while
 * exporting files. A single conservative value bounds the file-export memory peak to at most this many file rows at a
 * time, independent of the asset batch size. Each chunk is inserted and released before the next chunk is fetched.
 */
const FILE_CHUNK_SIZE = 10;

export class ExportToViewService {
  private readonly allowedWorkgroupIds: number[];
  private readonly publicAssetConfigs: Map<number, Omit<AssetInfo, 'assetId'>> = new Map();

  private readonly sourcePrisma: PrismaClient;
  private readonly destinationPrisma: PrismaClient;

  constructor(sourcePrisma: PrismaClient, destinationPrisma: PrismaClient, config: SyncConfig) {
    this.allowedWorkgroupIds = config.source.allowedWorkgroupIds;
    this.sourcePrisma = sourcePrisma;
    this.destinationPrisma = destinationPrisma;
  }

  public async exportToView() {
    this.publicAssetConfigs.clear();

    const publicAssets = await this.findPublicAssetIds();
    publicAssets.forEach(({ assetId, ...rest }) => this.publicAssetConfigs.set(assetId, rest));

    log(`Found ${this.publicAssetConfigs.size} public assets.`);

    const batches = this.batchList(publicAssets, BATCH_SIZE);
    log(`Created ${batches.length} batches with batch size ${BATCH_SIZE}.`);

    await this.exportItems();

    const workgroupIds = [...new Set(publicAssets.map((item) => item.workgroupId))];
    await this.export('workgroup', 'id', workgroupIds);

    // batch the list of public asset ids
    for (const [index, batch] of batches.entries()) {
      const batchNumber = index + 1;
      log(`Export batch #${batchNumber}`);
      const time = Date.now();
      const assetIds = batch.map((item) => item.assetId);
      await this.exportAssets(assetIds);
      await this.exportFiles(assetIds, batchNumber);
      await this.export('assetLanguage', 'assetId', assetIds, true);

      await this.export('manCatLabelRef', 'assetId', assetIds, true);
      await this.export('typeNatRel', 'assetId', assetIds, true);

      const timeTaken = Date.now() - time;
      log(`Exported batch #${batchNumber} of ${assetIds.length} assets in ${timeTaken} ms.`, 'batch');
      this.logMemoryUsage(`after batch #${batchNumber}`, { batch: batchNumber, assets: assetIds.length });
    }

    // only export siblings after all assets have been exported so no foreign key constraint is violated
    for (const [index, batch] of batches.entries()) {
      log(`Export siblings batch #${index + 1}`);
      const assetIds = batch.map((item) => item.assetId);
      await this.exportSiblings(assetIds, [...this.publicAssetConfigs.keys()]);
    }

    // Cleanup files that are not linked to any exported asset
    let cleaned = await this.destinationPrisma.$executeRaw`
      DELETE FROM "file"
      WHERE NOT EXISTS (
        SELECT 1 FROM "asset"
        WHERE "asset"."asset_id" = "file"."asset_id"
      );
    `;
    log(`Removed ${cleaned} files not used in any relation.`, 'batch');

    // Cleanup relations that are not used in any reference
    cleaned = await this.destinationPrisma.$executeRaw`
          DELETE FROM "contact"
          WHERE NOT EXISTS (
            SELECT 1 FROM "asset_contact"
            WHERE "asset_contact"."contact_id" = "contact"."contact_id"
          );
        `;
    log(`Removed ${cleaned} contacts not used in any relation.`, 'batch');
  }

  /**
   * Export assets with the given ids.
   *
   * Note: files are intentionally *not* exported here. They are exported by {@link ExportToViewService.exportFiles}
   * from the outer batch loop, so that the local `assets`, `filteredAssets` and contact arrays of this method become
   * unreachable (and collectible) before any heavy file rows are fetched.
   */
  private async exportAssets(assetIds: number[]) {
    const assets: PublishedAssetSelection[] = await this.sourcePrisma.asset.findMany({
      where: {
        assetId: {
          in: assetIds,
        },
      },
      select: {
        assetId: true,
        titlePublic: true,
        isExtract: true,
        createDate: true,
        receiptDate: true,
        assetContacts: true,
        isNatRel: true,
        assetKindItemCode: true,
        assetFormatItemCode: true,
        workgroupId: true,
        isPublic: true,
        assetMainId: true,
        sgsId: true,
        geolDataInfo: true,
        geolAuxDataInfo: true,
        geolContactDataInfo: true,
        municipality: true,
      },
    });
    const filteredAssets = this.preparePublishedData(assets);

    let result = await this.destinationPrisma.asset.createMany({ data: filteredAssets.assets });
    log(`Created ${result.count} assets.`, 'batch');

    await this.exportWorkflows(assetIds);

    result = await this.destinationPrisma.assetContact.createMany({ data: filteredAssets.assetContacts });
    log(`Created ${result.count} assetContacts.`, 'batch');

    const geometriesToPublish = assetIds.filter((f) => this.publicAssetConfigs.get(f)?.publishData.geometries);
    for (const [idx, batch] of this.batchList(geometriesToPublish, BATCH_SIZE_GEOMETRIES).entries()) {
      log(`Creating batch #${idx + 1} of geometries`, 'batch');
      await this.exportGeometries(batch, 'study_area');
      await this.exportGeometries(batch, 'study_location');
      await this.exportGeometries(batch, 'study_trace');
      log(`Finished batch #${idx + 1} of geometries`, 'batch');
    }
  }

  /**
   * Export the publishable files of the given assets in a memory-bounded fashion.
   *
   * Instead of loading every file (including its large JSON columns `fulltextContent`, `pageRangeClassifications`
   * and `pageDimensions`) for the whole asset batch at once, this method:
   *   1. determines which file *types* are publishable per asset (Normal / Legal) from the publish config;
   *   2. filters the publishable files in the *database* (never loading the large columns of non-publishable files);
   *   3. fetches only the file ids first;
   *   4. then, one fixed-size chunk at a time, fetches those full rows, transforms them, inserts them, and drops the
   *      references before fetching the next chunk.
   *
   * No file rows are accumulated across fetch iterations: at most one {@link FILE_CHUNK_SIZE}-sized batch is processed at a time.
   * The publication rules are preserved exactly: `Normal` files are exported for assets whose config has
   * `normalFiles`, `Legal` files for assets whose config has `legalFiles`.
   */
  private async exportFiles(assetIds: number[], batchNumber: number) {
    const normalFileAssetIds = assetIds.filter((id) => this.publicAssetConfigs.get(id)?.publishData.normalFiles);
    const legalFileAssetIds = assetIds.filter((id) => this.publicAssetConfigs.get(id)?.publishData.legalFiles);

    const typeFilters: Prisma.FileWhereInput[] = [];
    if (normalFileAssetIds.length > 0) {
      typeFilters.push({ assetId: { in: normalFileAssetIds }, type: 'Normal' });
    }
    if (legalFileAssetIds.length > 0) {
      typeFilters.push({ assetId: { in: legalFileAssetIds }, type: 'Legal' });
    }

    if (typeFilters.length === 0) {
      return;
    }

    const where: Prisma.FileWhereInput = { OR: typeFilters };

    // Only fetch the ids first: this keeps the "which files to export" list cheap and lets us pull the heavy rows in
    // small, fixed-size chunks below.
    const fileIdRows = await this.sourcePrisma.file.findMany({
      where,
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    const fileIds = fileIdRows.map((row) => row.id);

    if (fileIds.length === 0) {
      return;
    }

    let totalCreated = 0;

    for (const [chunkIndex, idChunk] of this.batchList(fileIds, FILE_CHUNK_SIZE).entries()) {
      const chunkNumber = chunkIndex + 1;
      const memoryContext = { batch: batchNumber, chunk: chunkNumber, ids: idChunk.length };

      this.logMemoryUsage('before files', memoryContext);

      const files = await this.sourcePrisma.file.findMany({
        where: { id: { in: idChunk } },
        orderBy: { id: 'asc' },
      });
      this.logMemoryUsage('after file fetch', { ...memoryContext, fetched: files.length });

      const inputs: Prisma.FileCreateManyInput[] = files.map((file) => ({
        ...file,
        pageRangeClassifications: file.pageRangeClassifications as Prisma.InputJsonValue,
        fulltextContent: file.fulltextContent as Prisma.InputJsonValue,
        pageDimensions: file.pageDimensions as Prisma.InputJsonValue,
      }));

      const result = await this.destinationPrisma.file.createMany({ data: inputs, skipDuplicates: true });
      totalCreated += result.count;
      this.logMemoryUsage('after file insert', { ...memoryContext, inserted: result.count });

      // `files` and `inputs` go out of scope on the next iteration, so at most one chunk of heavy rows is retained.
    }

    this.logMemoryUsage(`after files of batch #${batchNumber}`, {
      batch: batchNumber,
      files: fileIds.length,
      created: totalCreated,
    });
  }

  /**
   * Log the current process memory usage together with the V8 heap limit and optional extra context. Emitted at
   * batch boundaries and around each file chunk so heap growth can be correlated with batch number, chunk number and
   * file counts. Deliberately avoids serializing file contents (no JSON.stringify) so that logging cannot itself
   * allocate large temporaries.
   */
  private logMemoryUsage(context: string, extra: Record<string, number | string> = {}) {
    const mem = process.memoryUsage();
    const heapLimit = getHeapStatistics().heap_size_limit;
    const parts = [
      `rss=${this.formatBytes(mem.rss)}`,
      `heapUsed=${this.formatBytes(mem.heapUsed)}`,
      `heapTotal=${this.formatBytes(mem.heapTotal)}`,
      `external=${this.formatBytes(mem.external)}`,
      `arrayBuffers=${this.formatBytes(mem.arrayBuffers)}`,
      `heapLimit=${this.formatBytes(heapLimit)}`,
      ...Object.entries(extra).map(([key, value]) => `${key}=${value}`),
    ];
    log(`Memory [${context}] ${parts.join(' ')}`, 'batch');
  }

  private formatBytes(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * Export workflows for the given asset ids.
   * Copies the WorkflowSelection records (review + approval) first, then the Workflow records,
   * so that foreign key constraints are satisfied.
   */
  private async exportWorkflows(assetIds: number[]) {
    const workflows = await this.sourcePrisma.workflow.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, status: true, hasRequestedChanges: true, reviewId: true, approvalId: true },
    });

    const selectionIds = workflows.flatMap((w) => [w.reviewId, w.approvalId]);
    await this.export('workflowSelection', 'id', selectionIds, true);

    const result = await this.destinationPrisma.workflow.createMany({ data: workflows });
    log(`Created ${result.count} workflows.`, 'batch');
  }

  /**
   * Exports all geometries for a given table. Uses $queryRawUnsafe because we parametrize the table name and the
   * asset ids directly, but this is safe here since the table name is parametrized here, and values are passed directly
   * from other elements, i.e. numbers. For safety, these are still handled via parameters (note: SQL params start at 1,
   * like $1, $2, ...)
   */
  private async exportGeometries(assetIds: number[], table: 'study_area' | 'study_location' | 'study_trace') {
    const query = `
      SELECT ${table}_id as "id",
             asset_id    as "assetId",
             st_astext(geom, 2056) as geom
      FROM ${table}
      WHERE asset_id IN (${assetIds.map((_, idx) => `$${++idx}`).join(',')})
    `;
    const geometries = await this.sourcePrisma.$queryRawUnsafe<{ id: number; assetId: number; geom: string }[]>(
      query,
      ...assetIds,
    );

    if (geometries.length === 0) {
      log(`No geometries found in ${table}. Continuing.`, 'batch');
      return;
    }

    let paramIdx = 0;
    const insertQuery = `
      INSERT INTO ${table} (${table}_id, asset_id, geom)
      VALUES ${geometries.map(() => `($${++paramIdx}, $${++paramIdx}, ST_GeomFromText($${++paramIdx}, 2056))`)}
    `;

    const result = await this.destinationPrisma.$executeRawUnsafe(
      insertQuery,
      ...geometries.flatMap((f) => Object.values(f)),
    );
    log(`Created ${result} geometries in ${table}.`, 'batch');
  }

  /**
   * Export the static item tables.
   */
  private async exportItems() {
    const tables = [
      'AssetFormatItem',
      'AssetKindItem',
      'ContactKindItem',
      'LanguageItem',
      'LegalDocItem',
      'ManCatLabelItem',
      'NatRelItem',
      'Contact',
    ];

    for (const table of tables) {
      await this.exportTable(table);
    }
  }

  /**
   * Export all entries of the table.
   */
  private async exportTable(table: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source: any = this.sourcePrisma[table as keyof PrismaClient];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const destination: any = this.destinationPrisma[table as keyof PrismaClient];

    const items = await source.findMany();
    const result = await destination.createMany({ data: items, skipDuplicates: true });
    log(`Created ${result.count} ${table}.`);
  }

  /**
   * Export table with ids.
   */
  private async export(table: string, idField: string, ids: number[], partOfBatch = false) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source: any = this.sourcePrisma[table as keyof PrismaClient];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const destination: any = this.destinationPrisma[table as keyof PrismaClient];
    const items = await source.findMany({ where: { [idField]: { in: ids } } });
    const result = await destination.createMany({ data: items, skipDuplicates: true });
    log(`Created ${result.count} ${table}.`, partOfBatch ? 'batch' : 'main');
  }

  /**
   * Export siblings. Respects the publication value of all assets, i.e. if X value is not published, it is not copied,
   * and if the Y value is not published, it is not copied as well.
   */
  private async exportSiblings(ids: number[], allPublicAssetIds: number[]) {
    const assetIdsWithReferencesForPublication = ids.filter(
      (id) => this.publicAssetConfigs.get(id)?.publishData.references,
    );
    const itemsX = await this.sourcePrisma.assetXAssetY.findMany({
      where: { assetXId: { in: assetIdsWithReferencesForPublication } },
    });
    log(
      `Got ${ids.length} assetX references, filtered ${assetIdsWithReferencesForPublication.length} assetX for publication, found ${itemsX.length} assetX in databasse.`,
      'batch',
    );

    const publicSiblings = itemsX
      .filter(
        (item) =>
          allPublicAssetIds.includes(item.assetYId) &&
          this.publicAssetConfigs.get(item.assetYId)?.publishData.references,
      )
      .map((item) => item);
    const result = await this.destinationPrisma.assetXAssetY.createMany({ data: publicSiblings });

    log(`Created ${result.count} siblings.`, 'batch');
  }

  /**
   * Find public asset ids.
   */
  private async findPublicAssetIds() {
    return this.sourcePrisma.$queryRaw<AssetInfo[]>`SELECT a.asset_id     AS "assetId",
                                                           a.workgroup_id AS "workgroupId",
                                                           json_build_object(
                                                             'authors', ws.authors,
                                                             'initiators', ws.initiators,
                                                             'suppliers', ws.suppliers,
                                                             'general', ws.general,
                                                             'geometries', ws.geometries,
                                                             'legacy', ws.legacy,
                                                             'normalFiles', ws.normal_files,
                                                             'legalFiles', ws.legal_files,
                                                             'references', ws."references"
                                                           )              as "publishData"
                                                    FROM asset a
                                                           LEFT JOIN workflow w ON a.asset_id = w.id
                                                           LEFT JOIN workflow_selection ws ON w.approval_id = ws.id
                                                    WHERE a.is_public
                                                      AND w.status = 'Published'
                                                      AND workgroup_id IN (${Prisma.join(this.allowedWorkgroupIds)})
                                                    ORDER BY a.asset_id
    `;
  }

  /**
   * Batch list.
   */
  private batchList<T>(list: T[], batchSize: number): T[][] {
    const batches = [];
    for (let i = 0; i < list.length; i += batchSize) {
      batches.push(list.slice(i, i + batchSize));
    }
    return batches;
  }

  private preparePublishedData(assets: PublishedAssetSelection[]): {
    assets: Prisma.AssetCreateManyInput[];
    assetContacts: Prisma.AssetContactCreateManyInput[];
  } {
    const filteredAssets: Prisma.AssetCreateManyInput[] = [];
    const filteredAssetContacts: Prisma.AssetContactCreateManyInput[] = [];
    for (const { assetContacts, ...asset } of assets) {
      const publicAssetConfig = this.publicAssetConfigs.get(asset.assetId);
      if (publicAssetConfig === undefined) {
        continue;
      }
      const { publishData } = publicAssetConfig;

      // todo: fix module boundaries for ContactAssignmentRole
      if (publishData.authors) {
        filteredAssetContacts.push(...assetContacts.filter((c) => c.role === 'author'));
      }
      if (publishData.initiators) {
        filteredAssetContacts.push(...assetContacts.filter((c) => c.role === 'initiator'));
      }
      if (publishData.suppliers) {
        filteredAssetContacts.push(...assetContacts.filter((c) => c.role === 'supplier'));
      }

      const filteredAsset: Prisma.AssetCreateManyInput = {
        ...asset,
        // optional fields for siblings
        assetMainId:
          publishData.references && asset.assetMainId && this.publicAssetConfigs.has(asset.assetMainId)
            ? asset.assetMainId
            : null,
        // optional fields for legacy
        sgsId: publishData.legacy ? asset.sgsId : null,
        geolDataInfo: publishData.legacy ? asset.geolDataInfo : null,
        geolContactDataInfo: publishData.legacy ? asset.geolContactDataInfo : null,
        geolAuxDataInfo: publishData.legacy ? asset.geolAuxDataInfo : null,
        municipality: publishData.legacy ? asset.municipality : null,
      };
      filteredAssets.push(filteredAsset);
    }
    return {
      assets: filteredAssets,
      assetContacts: filteredAssetContacts,
    };
  }
}
