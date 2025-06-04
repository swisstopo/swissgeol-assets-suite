import { Prisma, PrismaClient } from '@prisma/client';
import { SyncConfig } from './config';
import { log } from './log';

/**
 * Contains all attributes that should be published, _except_ the geometries which need to be merged manually due to
 * missing PostGIS support in Prisma.
 */
type PublishedAssetSelection = Prisma.AssetGetPayload<{
  select: {
    assetId: true;
    titlePublic: true;
    isExtract: true;
    createDate: true;
    receiptDate: true;
    assetContacts: true;
    assetFiles: {
      include: {
        file: true;
      };
    };
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

const BATCH_SIZE = 500;

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
    const publicAssets = await this.findPublicAssetIds();
    publicAssets.forEach(({ assetId, ...rest }) => this.publicAssetConfigs.set(assetId, rest));

    log(`Found ${this.publicAssetConfigs.size} public assets.`);

    const batches = this.batchList(publicAssets);
    log(`Created ${batches.length} batches with batch size ${BATCH_SIZE}.`);

    await this.exportItems();

    const workgroupIds = [...new Set(publicAssets.map((item) => item.workgroupId))];
    await this.export('workgroup', 'id', workgroupIds);

    // batch the list of public asset ids
    for (const [index, batch] of batches.entries()) {
      log(`Export batch #${index + 1}`);
      const time = Date.now();
      const assetIds = batch.map((item) => item.assetId);
      await this.exportAssets(assetIds);
      await this.export('assetLanguage', 'assetId', assetIds, true);

      await this.export('manCatLabelRef', 'assetId', assetIds, true);
      await this.export('typeNatRel', 'assetId', assetIds, true);

      const timeTaken = Date.now() - time;
      log(`Exported batch #${index + 1} of ${assetIds.length} assets in ${timeTaken} ms.`, 'batch');
    }

    // only export siblings after all assets have been exported so no foreign key constraint is violated
    for (const [index, batch] of batches.entries()) {
      log(`Export siblings batch #${index + 1}`);
      const assetIds = batch.map((item) => item.assetId);
      await this.exportSiblings(assetIds, [...this.publicAssetConfigs.keys()]);
    }

    // Cleanup relations that are not used in any reference
    let cleaned = await this.destinationPrisma.$executeRaw`
      DELETE FROM "file"
      WHERE NOT EXISTS (
        SELECT 1 FROM "asset_file"
        WHERE "asset_file"."file_id" = "file"."id"
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
        assetFiles: {
          include: { file: true },
        },
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

    result = await this.destinationPrisma.assetContact.createMany({ data: filteredAssets.assetContacts });
    log(`Created ${result.count} assetContacts.`, 'batch');

    result = await this.destinationPrisma.assetFile.createMany({ data: filteredAssets.assetFiles });
    log(`Created ${result.count} assetFiles.`, 'batch');

    const geometriesToPublish = assetIds.filter((f) => this.publicAssetConfigs.get(f).publishData.geometries);
    await this.exportGeometries(geometriesToPublish, 'study_area');
    await this.exportGeometries(geometriesToPublish, 'study_location');
    await this.exportGeometries(geometriesToPublish, 'study_trace');
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
      'File',
    ];

    for (const table of tables) {
      await this.exportTable(table);
    }
  }

  /**
   * Export all entries of the table.
   */
  private async exportTable(table: string) {
    const items = await this.sourcePrisma[table].findMany();
    const result = await this.destinationPrisma[table].createMany({ data: items, skipDuplicates: true });

    log(`Created ${result.count} ${table}.`);
  }

  /**
   * Export table with ids.
   */
  private async export(table: string, idField: string, ids: number[], partOfBatch = false) {
    const items = await this.sourcePrisma[table].findMany({ where: { [idField]: { in: ids } } });
    const result = await this.destinationPrisma[table].createMany({ data: items, skipDuplicates: true });

    log(`Created ${result.count} ${table}.`, partOfBatch ? 'batch' : 'main');
  }

  /**
   * Export siblings. Respects the publication value of all assets, i.e. if X value is not published, it is not copied,
   * and if the Y value is not published, it is not copied as well.
   */
  private async exportSiblings(ids: number[], allPublicAssetIds: number[]) {
    const assetIdsWithReferencesForPublication = ids.filter(
      (id) => this.publicAssetConfigs.get(id).publishData.references,
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
          this.publicAssetConfigs.get(item.assetYId).publishData.references,
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
  private batchList<T>(list: T[]): T[][] {
    const batches = [];
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      batches.push(list.slice(i, i + BATCH_SIZE));
    }
    return batches;
  }

  private preparePublishedData(assets: PublishedAssetSelection[]): {
    assets: Prisma.AssetCreateManyInput[];
    assetContacts: Prisma.AssetContactCreateManyInput[];
    assetFiles: Prisma.AssetFileCreateManyInput[];
  } {
    const filteredAssets: Prisma.AssetCreateManyInput[] = [];
    const filteredAssetFiles: Prisma.AssetFileCreateManyInput[] = [];
    const filteredAssetContacts: Prisma.AssetContactCreateManyInput[] = [];
    for (const { assetFiles, assetContacts, ...asset } of assets) {
      const { publishData } = this.publicAssetConfigs.get(asset.assetId);
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

      if (publishData.legalFiles) {
        filteredAssetFiles.push(
          ...assetFiles.filter((f) => f.file.type === 'Legal').map((f) => ({ assetId: f.assetId, fileId: f.fileId })),
        );
      }
      if (publishData.normalFiles) {
        filteredAssetFiles.push(
          ...assetFiles.filter((f) => f.file.type === 'Normal').map((f) => ({ assetId: f.assetId, fileId: f.fileId })),
        );
      }

      const filteredAsset: Prisma.AssetCreateManyInput = {
        ...asset,
        // optional fields for siblings
        assetMainId: publishData.references ? asset.assetMainId : null,
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
      assetFiles: filteredAssetFiles,
    };
  }
}
