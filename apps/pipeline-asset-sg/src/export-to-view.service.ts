import { Prisma, PrismaClient } from '@prisma/client';
import { log } from './log';

const unique = (value, index, self) => self.indexOf(value) === index;

export class ExportToViewService {
  private readonly sourceConnectionString: string;
  private readonly destinationConnectionString: string;
  private readonly allowedWorkgroupIds: number[];

  private readonly sourcePrisma: PrismaClient;
  private readonly destinationPrisma: PrismaClient;

  private readonly batchSize = 500;

  constructor(sourceConnectionString: string, destinationConnectionString: string, allowedWorkgroupIds: number[]) {
    this.sourceConnectionString = sourceConnectionString;
    this.destinationConnectionString = destinationConnectionString;
    this.allowedWorkgroupIds = allowedWorkgroupIds;

    this.sourcePrisma = new PrismaClient({
      datasources: {
        db: {
          url: this.sourceConnectionString,
        },
      },
    });

    this.destinationPrisma = new PrismaClient({
      datasources: {
        db: {
          url: this.destinationConnectionString,
        },
      },
    });
  }

  public async exportToView() {
    const publicAssets = await this.findPublicAssetIds();
    const publicAssetIds = publicAssets.map((item) => item.asset_id);
    log(`Found ${publicAssetIds.length} public assets.`);

    const batches = this.batchList(publicAssets);
    log(`Created ${batches.length} batches with batchsize ${this.batchSize}.`);

    await this.exportItems();

    const workgroupIds = publicAssets.map((item) => item.workgroup_id).filter(unique);
    await this.export('workgroup', 'id', workgroupIds);

    // batch the list of public asset ids
    for (const batch of batches) {
      const time = Date.now();
      const assetIds = batch.map((item) => item.asset_id);
      const internalUseIds = batch.map((item) => item.internal_use_id);
      const publicUseIds = batch.map((item) => item.public_use_id);
      await this.export('internalUse', 'internalUseId', internalUseIds);
      await this.export('publicUse', 'publicUseId', publicUseIds);
      await this.exportAssets(assetIds);
      await this.export('assetFormatComposition', 'assetId', assetIds);
      await this.export('assetKindComposition', 'assetId', assetIds);
      await this.exportInternalProjects(assetIds);
      await this.export('assetLanguage', 'assetId', assetIds);
      await this.exportPublications(assetIds);
      await this.exportSiblings(assetIds, publicAssetIds);

      await this.export('autoCat', 'assetId', assetIds);
      await this.export('manCatLabelRef', 'assetId', assetIds);
      await this.export('statusWork', 'assetId', assetIds);
      await this.export('studyArea', 'assetId', assetIds);
      await this.export('studyLocation', 'assetId', assetIds);
      await this.export('studyTrace', 'assetId', assetIds);
      await this.export('typeNatRel', 'assetId', assetIds);

      const timeTaken = Date.now() - time;
      log(`Exported batch of ${assetIds.length} assets in ${timeTaken} ms.`);
    }

    await this.exportFiles(publicAssetIds);
  }

  /**
   * Export assets with the given ids.
   */
  private async exportAssets(assetIds: number[]) {
    const assets = await this.sourcePrisma.asset.findMany({
      where: {
        assetId: {
          in: assetIds,
        },
      },
      select: {
        assetId: true,
        titlePublic: true,
        isNatRel: true,
        receiptDate: true,
        url: true,
        locationAnalog: true,
        lastProcessedDate: true,
        textBody: true,
        remark: true,
        assetKindItemCode: true,
        createDate: true,
        assetFormatItemCode: true,
        authorBiblio: true,
        sourceProject: true,
        description: true,
        isExtract: true,
        internalUseId: true,
        publicUseId: true,
        assetMainId: true,
        workgroupId: true,

        titleOriginal: false,
        sgsId: false,
        geolDataInfo: false,
        geolContactDataInfo: false,
        geolAuxDataInfo: false,
        municipality: false,
        processor: false,
      },
    });

    const result = await this.destinationPrisma.asset.createMany({ data: assets });

    log(`Created ${result.count} assets.`);
  }

  /**
   * Export the static item tables.
   */
  private async exportItems() {
    const tables = [
      'AssetFormatItem',
      'AssetKindItem',
      'AutoCatLabelItem',
      'AutoObjectCatItem',
      'ContactKindItem',
      'GeomQualityItem',
      'LanguageItem',
      'LegalDocItem',
      'ManCatLabelItem',
      'NatRelItem',
      'PubChannelItem',
      'StatusAssetUseItem',
      'StatusWorkItem',
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
  private async export(table: string, idField = 'id', ids: number[]) {
    const items = await this.sourcePrisma[table].findMany({ where: { [idField]: { in: ids } } });
    const result = await this.destinationPrisma[table].createMany({ data: items, skipDuplicates: true });

    log(`Created ${result.count} ${table}.`);
  }

  /**
   * Export files.
   * Remove files which start with 'LDoc'
   */
  private async exportFiles(assetIds: number[]) {
    log(`Starting file export.`);
    // Read all unique file ids from the assetFiles
    const assetFiles = await this.sourcePrisma.assetFile.findMany({ where: { assetId: { in: assetIds } } });
    const fileIds = assetFiles.map((af) => af.fileId).filter(unique);
    const files = await this.sourcePrisma.file.findMany({ where: { fileId: { in: fileIds } } });

    // Filter out files which start with 'LDoc'
    const filesWithoutLegalDocs = files.filter((file) => !file.fileName.startsWith('LDoc'));

    // Write files to the destination database
    const fileResult = await this.destinationPrisma.file.createMany({
      data: filesWithoutLegalDocs,
      skipDuplicates: true,
    });
    log(`Created ${fileResult.count} files.`);
    await this.export('assetObjectInfo', 'fileId', fileIds);
    const assetFileResult = await this.destinationPrisma.assetFile.createMany({ data: assetFiles });
    log(`Created ${assetFileResult.count} AssetFiles.`);

    // Write file to S3
    // s3service.uploadFiles(filesWithoutLegalDocs);
  }

  /**
   * Export publications.
   *       'asset_publication',
   *       'publication',
   */
  private async exportPublications(assetIds: number[]) {
    const assetPublications = await this.sourcePrisma.assetPublication.findMany({
      where: { assetId: { in: assetIds } },
    });
    const publicationIds = assetPublications.map((af) => af.publicationId);

    await this.export('publication', 'publicationId', publicationIds);

    const assetFileResult = await this.destinationPrisma.assetPublication.createMany({ data: assetPublications });
    log(`Created ${assetFileResult.count} publications.`);
  }

  /**
   * Export internal projects.
   *       'asset_internal_project',
   *       'internal_project',
   */
  private async exportInternalProjects(assetIds: number[]) {
    const aip = await this.sourcePrisma.assetInternalProject.findMany({ where: { assetId: { in: assetIds } } });
    const ips = await this.sourcePrisma.internalProject.findMany({
      where: { internalProjectId: { in: aip.map((af) => af.internalProjectId) } },
    });
    const fileResult = await this.destinationPrisma.internalProject.createMany({ data: ips, skipDuplicates: true });
    log(`Created ${fileResult.count} internal_project.`);
    const assetFileResult = await this.destinationPrisma.assetInternalProject.createMany({ data: aip });
    log(`Created ${assetFileResult.count} asset_internal_project.`);
  }

  /**
   * Export internal use.
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
    return this.sourcePrisma.$queryRaw<
      { asset_id: number; public_use_id: number; internal_use_id: number; workgroup_id: number }[]
    >`
      SELECT a.asset_id,a.public_use_id,a.internal_use_id,a.workgroup_id FROM asset a
      LEFT JOIN public_use p ON a.public_use_id = p.public_use_id
      LEFT JOIN LATERAL (SELECT * FROM status_work WHERE asset_id = a.asset_id ORDER BY status_work_date DESC LIMIT 1) AS sw ON a.asset_id = sw.asset_id
      WHERE p.is_available
            AND p.status_asset_use_item_code = 'approved'
            AND sw.status_work_item_code = 'published'
            AND workgroup_id IN (${Prisma.join(this.allowedWorkgroupIds)})
      ORDER BY a.asset_id
    `;
  }

  /**
   * Batch list.
   */
  private batchList<T>(list: T[]): T[][] {
    let skip = 0;
    const batches = [];
    while (skip < list.length) {
      batches.push(list.slice(skip, (skip += this.batchSize)));
    }
    return batches;
  }
}
