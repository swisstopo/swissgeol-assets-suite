import { Prisma, PrismaClient } from '@prisma/client';
import { SyncConfig } from './config';
import { log } from './log';

interface AssetInfo {
  assetId: number;
  workgroupId: number;
}

const BATCH_SIZE = 500;

export class ExportToViewService {
  private readonly allowedWorkgroupIds: number[];

  private readonly sourcePrisma: PrismaClient;
  private readonly destinationPrisma: PrismaClient;

  constructor(sourcePrisma: PrismaClient, destinationPrisma: PrismaClient, config: SyncConfig) {
    this.allowedWorkgroupIds = config.source.allowedWorkgroupIds;
    this.sourcePrisma = sourcePrisma;
    this.destinationPrisma = destinationPrisma;
  }

  public async exportToView() {
    const publicAssets = await this.findPublicAssetIds();
    const publicAssetIds = publicAssets.map((item) => item.assetId);
    log(`Found ${publicAssetIds.length} public assets.`);

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
      await this.exportStudyAreas(assetIds);
      await this.exportStudyLocations(assetIds);
      await this.exportStudyTraces(assetIds);
      await this.export('typeNatRel', 'assetId', assetIds);

      const timeTaken = Date.now() - time;
      log(`Exported batch of ${assetIds.length} assets in ${timeTaken} ms.`);
    }

    // only export siblings after all assets have been exported so no foreign key constraint is violated
    for (const batch of batches) {
      const assetIds = batch.map((item) => item.assetId);
      await this.exportSiblings(assetIds, publicAssetIds);
    }

    await this.exportFiles(publicAssetIds);
  }

  /**
   * Export study areas as raw query with st_astext.
   */
  private async exportStudyAreas(assetIds: number[]) {
    const studyAreas = await this.sourcePrisma.$queryRaw<{ studyAreaId: number; assetId: number; geom: string }[]>`
      SELECT study_area_id          as "studyAreaId",
             asset_id               as "assetId",
             st_astext(geom, 2056)  as geom
      FROM study_area
      WHERE asset_id IN (${Prisma.join(assetIds)})
    `;

    if (studyAreas.length === 0) {
      log(`No study areas found. Continuing.`);
      return;
    }

    const formattedStudyAreas = studyAreas.map(
      (sa) => Prisma.sql`(${sa.studyAreaId}, ${sa.assetId}, ST_GeomFromText(${sa.geom}, 2056))`,
    );

    // insert into destination as raw query
    const result = await this.destinationPrisma.$executeRaw`
      INSERT INTO study_area (study_area_id, asset_id, geom)
      VALUES ${Prisma.join(formattedStudyAreas)}
    `;

    log(`Created ${result} study areas.`);
  }

  /**
   * Export study locations as raw query with st_astext.
   */
  private async exportStudyLocations(assetIds: number[]) {
    const studyLocations = await this.sourcePrisma.$queryRaw<
      { studyLocationId: number; assetId: number; geom: string }[]
    >`
      SELECT study_location_id      as "studyLocationId",
             asset_id               as "assetId",
             st_astext(geom, 2056)  as geom
      FROM study_location
      WHERE asset_id IN (${Prisma.join(assetIds)})
    `;

    if (studyLocations.length === 0) {
      log(`No study locations found. Continuing.`);
      return;
    }

    const formattedStudyLocations = studyLocations.map(
      (sa) => Prisma.sql`(${sa.studyLocationId}, ${sa.assetId}, ST_GeomFromText(${sa.geom}, 2056))`,
    );

    // insert into destination as raw query
    const result = await this.destinationPrisma.$executeRaw`
      INSERT INTO study_location (study_location_id, asset_id, geom)
      VALUES ${Prisma.join(formattedStudyLocations)}
    `;

    log(`Created ${result} study locations.`);
  }

  /**
   * Export study traces as raw query with st_astext.
   */
  private async exportStudyTraces(assetIds: number[]) {
    const studyTraces = await this.sourcePrisma.$queryRaw<{ studyTraceId: number; assetId: number; geom: string }[]>`
      SELECT study_trace_id         as "studyTraceId",
             asset_id               as "assetId",
             st_astext(geom, 2056)  as geom
      FROM study_trace
      WHERE asset_id IN (${Prisma.join(assetIds)})
    `;

    if (studyTraces.length === 0) {
      log(`No study traces found. Continuing.`);
      return;
    }

    const formattedStudyTraces = studyTraces.map(
      (sa) => Prisma.sql`(${sa.studyTraceId}, ${sa.assetId}, ST_GeomFromText(${sa.geom}, 2056))`,
    );

    // insert into destination as raw query
    const result = await this.destinationPrisma.$executeRaw`
      INSERT INTO study_trace (study_trace_id, asset_id, geom)
      VALUES ${Prisma.join(formattedStudyTraces)}
    `;

    log(`Created ${result} study traces.`);
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
      'ContactKindItem',
      'LanguageItem',
      'LegalDocItem',
      'ManCatLabelItem',
      'NatRelItem',
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
   * Export non-legal files.
   */
  private async exportFiles(assetIds: number[]) {
    log(`Starting file export.`);
    // Read all unique file ids from the assetFiles which are not legal docs.
    const assetFiles = await this.sourcePrisma.assetFile.findMany({
      where: { assetId: { in: assetIds }, file: { type: { not: 'Legal' } } },
    });
    const fileIds = [...new Set(assetFiles.map((af) => af.fileId))];
    const files = await this.sourcePrisma.file.findMany({ where: { id: { in: fileIds } } });

    // Write files to the destination database
    const fileResult = await this.destinationPrisma.file.createMany({
      data: files,
      skipDuplicates: true,
    });
    log(`Created ${fileResult.count} files.`);
    const assetFileResult = await this.destinationPrisma.assetFile.createMany({ data: assetFiles });
    log(`Created ${assetFileResult.count} AssetFiles.`);
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
    return this.sourcePrisma.$queryRaw<AssetInfo[]>`SELECT a.asset_id        as "assetId",
                                                           a.workgroup_id    as "workgroupId"
                                                    FROM asset a
                                                           LEFT JOIN workflow w ON a.asset_id = w.id
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
}
