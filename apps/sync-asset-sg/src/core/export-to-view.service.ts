import { Prisma, PrismaClient } from '@prisma/client';
import { SyncConfig } from './config';
import { log } from './log';

type PrismaAssetSelection = Prisma.AssetGetPayload<{
  select: {
    assetId: true;
    titlePublic: true;
    isExtract: true;
    createDate: true;
    lastProcessedDate: true;
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
    studyAreas: true;
    studyLocations: true;
    studyTraces: true;
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
    for (const batch of batches) {
      const time = Date.now();
      const assetIds = batch.map((item) => item.assetId);
      await this.exportAssets(assetIds);
      await this.export('assetLanguage', 'assetId', assetIds);

      await this.export('manCatLabelRef', 'assetId', assetIds);
      await this.export('typeNatRel', 'assetId', assetIds);

      const timeTaken = Date.now() - time;
      log(`Exported batch of ${assetIds.length} assets in ${timeTaken} ms.`);
    }

    // only export siblings after all assets have been exported so no foreign key constraint is violated
    for (const batch of batches) {
      const assetIds = batch.map((item) => item.assetId);
      await this.exportSiblings(assetIds, [...this.publicAssetConfigs.keys()]);
    }
  }

  /**
   * Export assets with the given ids.
   */
  private async exportAssets(assetIds: number[]) {
    const assets: PrismaAssetSelection[] = await this.sourcePrisma.asset.findMany({
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
        lastProcessedDate: true,
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
        studyAreas: true,
        studyTraces: true,
        studyLocations: true,
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
    log(`Created ${result.count} assets.`);

    result = await this.destinationPrisma.assetContact.createMany({ data: filteredAssets.assetContacts });
    log(`Created ${result.count} assetContacts.`);

    result = await this.destinationPrisma.assetFile.createMany({ data: filteredAssets.assetFiles });
    log(`Created ${result.count} assetFiles.`);

    result = await this.destinationPrisma.studyLocation.createMany({ data: filteredAssets.geometries.locations });
    log(`Created ${result.count} studyLocations.`);

    result = await this.destinationPrisma.studyArea.createMany({ data: filteredAssets.geometries.areas });
    log(`Created ${result.count} studyAreas.`);

    result = await this.destinationPrisma.studyTrace.createMany({ data: filteredAssets.geometries.traces });
    log(`Created ${result.count} studyTraces.`);

    // todo: skip
    //result = await this.destinationPrisma.assetXAssetY.createMany({ data: filteredAssets.siblings });
    //log(`Created ${result.count} siblings.`);
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
  private async export(table: string, idField: string, ids: number[]) {
    const items = await this.sourcePrisma[table].findMany({ where: { [idField]: { in: ids } } });
    const result = await this.destinationPrisma[table].createMany({ data: items, skipDuplicates: true });

    log(`Created ${result.count} ${table}.`);
  }

  /**
   * Export siblings.
   */
  private async exportSiblings(ids: number[], allPublicAssetIds: number[]) {
    const itemsX = await this.sourcePrisma.assetXAssetY.findMany({ where: { assetXId: { in: ids } } });

    const publicSiblings = itemsX.filter((item) => allPublicAssetIds.includes(item.assetYId)).map((item) => item);

    const result = await this.destinationPrisma.assetXAssetY.createMany({ data: publicSiblings });

    log(`Created ${result.count} siblings.`);
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

  private preparePublishedData(assets: PrismaAssetSelection[]): {
    assets: Prisma.AssetCreateManyInput[];
    assetContacts: Prisma.AssetContactCreateManyInput[];
    assetFiles: Prisma.AssetFileCreateManyInput[];
    geometries: GeometryContainer;
  } {
    const filteredAssets: Prisma.AssetCreateManyInput[] = [];
    const filteredAssetFiles: Prisma.AssetFileCreateManyInput[] = [];
    const filteredAssetContacts: Prisma.AssetContactCreateManyInput[] = [];
    const filteredGeometries: GeometryContainer = { areas: [], traces: [], locations: [] };
    for (const { assetFiles, assetContacts, studyTraces, studyAreas, studyLocations, ...asset } of assets) {
      const { publishData } = this.publicAssetConfigs.get(asset.assetId);
      if (publishData.geometries) {
        filteredGeometries.areas.push(...studyAreas);
        filteredGeometries.locations.push(...studyLocations);
        filteredGeometries.traces.push(...studyTraces);
      }
      // todo lme: fix module boundaries for ContactAssignmentRole
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

      // todo: make general stuff optional -> currently not possible
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
      geometries: filteredGeometries,
    };
  }
}

type GeometryContainer = {
  traces: Prisma.StudyTraceCreateManyInput[];
  areas: Prisma.StudyAreaCreateManyInput[];
  locations: Prisma.StudyLocationCreateManyInput[];
};
