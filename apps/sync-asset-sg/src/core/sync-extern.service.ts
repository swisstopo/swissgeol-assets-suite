import { Prisma, PrismaClient } from '@prisma/client';
import { SyncConfig } from './config';
import { log } from './log';

export class SyncExternService {
  private readonly config: SyncConfig;
  private syncAssignee: string | null = null;
  private geometries: Geometries = { areas: [], locations: [], traces: [] };

  private readonly sourcePrisma: PrismaClient;
  private readonly destinationPrisma: PrismaClient;

  constructor(sourcePrisma: PrismaClient, destinationPrisma: PrismaClient, config: SyncConfig) {
    this.config = config;
    this.sourcePrisma = sourcePrisma;
    this.destinationPrisma = destinationPrisma;
  }

  /**
   * TBD
   */
  public async syncExternalToInternal() {
    log('Starting data export from external');
    this.syncAssignee = (
      await this.destinationPrisma.assetUser.findFirst({
        select: { id: true },
        where: { email: this.config.syncAssignee },
      })
    )?.id;

    const alreadySyncedIds = (
      await this.destinationPrisma.assetSynchronization.findMany({
        select: { originalAssetId: true },
      })
    ).map((res) => res.originalAssetId);
    log(`Found ${alreadySyncedIds.length} already synced IDs which will be skipped`);

    const assetsToSync = (
      await this.sourcePrisma.asset.findMany({
        where: {
          assetId: {
            notIn: alreadySyncedIds,
          },
          isPublic: true,
        },
        include: {
          ids: { select: { id: true, description: true } },
          assetLanguages: { select: { languageItemCode: true } },
          manCatLabelRefs: { select: { manCatLabelItemCode: true } },
          typeNatRels: { select: { natRelItemCode: true } },
          assetContacts: {
            include: {
              contact: true,
            },
          },
          assetFiles: {
            include: {
              file: true,
            },
          },
        },
      })
    ).map((item) => {
      const { assetId, sgsId, assetFiles, assetContacts, manCatLabelRefs, typeNatRels, ids, assetLanguages, ...asset } =
        item;
      return {
        asset,
        manCatLabelRefs,
        assetLanguages,
        typeNatRels,
        ids,
        assetContacts,
        assetFiles,
        originalAssetId: assetId,
        originalSgsId: sgsId,
      };
    });
    this.geometries = await this.getGeometries(assetsToSync.map((a) => a.originalAssetId));

    log(`Found ${assetsToSync.length} assets in source database which need to be synced`);

    for (const asset of assetsToSync) {
      /**
       * Todo:
       * - Note that authors are NOT synchronzied; favorites are NOT synchronized; workflows are NOT synchronized
       * - siblings and relations :(
       */
      const contactsCreate = await this.createContactsPayload(asset.assetContacts);
      const filesCreate = await this.createFilesPayload(asset.assetFiles);

      const newAsset = await this.destinationPrisma.asset.create({
        data: {
          ...asset.asset,
          assetMainId: null, // this will be set afterwards
          assetFiles: filesCreate,
          assetContacts: contactsCreate,
          ids: {
            createMany: { data: asset.ids },
          },
          assetLanguages: {
            createMany: { data: asset.assetLanguages },
          },
          manCatLabelRefs: {
            createMany: { data: asset.manCatLabelRefs },
          },
          typeNatRels: {
            createMany: { data: asset.typeNatRels },
          },
          workflow: {
            create: {
              status: 'Draft',
              review: { create: {} },
              approval: { create: {} },
              changes: {
                create: {
                  comment: `Synchronized from EXTERN with original ID ${asset.originalAssetId}`,
                  fromStatus: 'Published',
                  toStatus: 'Draft',
                  toAssigneeId: this.syncAssignee,
                },
              },
            },
          },
          synchronization: {
            create: {
              originalAssetId: asset.originalAssetId,
              originalSgsId: asset.originalSgsId,
            },
          },
        },
      });

      await this.createGeometriesForAsset(asset.originalAssetId, newAsset.assetId);
    }
    // create references after all assets have been copied to get the most
    const assetSynchronisations = await this.destinationPrisma.assetSynchronization.findMany();
    const existingSiblings = await this.sourcePrisma.assetXAssetY.findMany({
      where: { assetXId: { in: assetsToSync.map((a) => a.originalAssetId) } },
    });
    for (const asset of assetsToSync) {
      const newAssetId = assetSynchronisations.find((n) => n.originalAssetId === asset.originalAssetId);
      const assetMainLink = assetSynchronisations.find((n) => n.originalAssetId === asset.asset.assetMainId);
      const originalAssetXSiblings = existingSiblings
        .filter((n) => n.assetXId === asset.originalAssetId)
        .map((n) => n.assetYId);
      const newAssetSiblings = assetSynchronisations
        .filter((n) => originalAssetXSiblings.includes(n.originalAssetId))
        .map((n) => n.assetId);

      await this.destinationPrisma.asset.update({
        where: { assetId: newAssetId.assetId },
        data: {
          assetMainId: assetMainLink?.assetId,
          siblingXAssets: { create: newAssetSiblings.map((n) => ({ assetYId: n })) },
        },
      });
    }
    log('Data export to extern completed');
  }

  /**
   * Creates an input for asset contacts by either connecting to existing contacts (matched by XXX) or by creating a new
   * contact.
   *
   * TODO: deep equality more fields
   * @param assetContacts
   * @private
   */
  private async createContactsPayload(
    assetContacts: Prisma.AssetContactGetPayload<{ include: { contact: true } }>[], // prettier-ignore
  ): Promise<Prisma.AssetContactUncheckedCreateNestedManyWithoutAssetInput> {
    const createKey = ({ name, locality }: { name: string; locality: string }) => `${name}||${locality}`;

    const existing = await this.destinationPrisma.contact.findMany({
      where: {
        OR: assetContacts.map(({ contact: { name, locality } }) => ({ name, locality })),
      },
    });
    const existingBeyKey = new Map(existing.map((c) => [createKey(c), c.contactId]));

    return {
      create: assetContacts.map(({ role, contact: { contactId: _, ...contact } }) => {
        const match = existingBeyKey.get(createKey(contact));
        return {
          role,
          contact: match ? { connect: { contactId: match } } : { create: contact },
        };
      }),
    };
  }

  /**
   * Creates an input for asset files by either connecting to existing files (matched by name) or by creating a new file
   * entry.
   * @param assetFiles
   * @private
   */
  private async createFilesPayload(
    assetFiles: Prisma.AssetFileGetPayload<{ include: { file: true } }>[],
  ): Promise<Prisma.AssetFileUncheckedCreateNestedManyWithoutAssetInput> {
    const existingFiles = await this.destinationPrisma.file.findMany({
      where: { name: { in: assetFiles.map(({ file }) => file.name) } },
    });
    const existingByName = new Map(existingFiles.map((f) => [f.name, f.id]));

    const create = assetFiles.map(({ file: { id: _, ...file } }) => {
      const match = existingByName.get(file.name);

      return match
        ? { file: { connect: { id: match } } }
        : (() => {
            return { file: { create: file } };
          })();
    });

    return { create };
  }

  private async getGeometries(assetIds: number[]): Promise<Geometries> {
    if (assetIds.length === 0) {
      return { areas: [], locations: [], traces: [] };
    }

    const areas: GeometryTransfer[] = await this.sourcePrisma.$queryRaw`
    SELECT
        study_area_id       AS "id",
        asset_id            AS "assetId",
        ST_ASBINARY(geom)   AS "geom",
        is_revised          AS "isRevised"
    FROM study_area
    WHERE asset_id IN (${Prisma.join(assetIds)})
    `;
    const locations: GeometryTransfer[] = await this.sourcePrisma.$queryRaw`
    SELECT
        study_location_id   AS "id",
        asset_id            AS "assetId",
        ST_ASBINARY(geom)   AS "geom",
        is_revised          AS "isRevised"
    FROM study_location
    WHERE asset_id IN (${Prisma.join(assetIds)})
    `;
    const traces: GeometryTransfer[] = await this.sourcePrisma.$queryRaw`
    SELECT
        study_trace_id      AS "id",
        asset_id            AS "assetId",
        ST_ASBINARY(geom)   AS "geom",
        is_revised          AS "isRevised"
    FROM study_trace
    WHERE asset_id IN (${Prisma.join(assetIds)})
    `;

    // todo: SET/Map
    return {
      areas,
      locations,
      traces,
    };
  }

  private async createGeometriesForAsset(originalAssetId: number, assetId: number) {
    const buildRows = <T extends { geom: Uint8Array | string; isRevised: boolean }>(list: T[]) =>
      list.map(({ geom, isRevised }) => Prisma.sql`(${assetId}, ST_GeomFromWKB(${geom}), ${isRevised})`);

    const areas = buildRows(this.geometries.areas.filter((a) => a.assetId === originalAssetId));
    const locations = buildRows(this.geometries.locations.filter((l) => l.assetId === originalAssetId));
    const traces = buildRows(this.geometries.traces.filter((t) => t.assetId === originalAssetId));

    if (areas.length) {
      await this.destinationPrisma.$executeRaw`
        INSERT INTO study_area (asset_id, geom, is_revised)
        VALUES ${Prisma.join(areas)}
      `;
    }

    if (locations.length) {
      await this.destinationPrisma.$executeRaw`
        INSERT INTO study_location (asset_id, geom, is_revised)
        VALUES ${Prisma.join(locations)}
      `;
    }

    if (traces.length) {
      await this.destinationPrisma.$executeRaw`
        INSERT INTO study_trace (asset_id, geom, is_revised)
        VALUES ${Prisma.join(traces)}
      `;
    }
  }
}

interface GeometryTransfer {
  id: number;
  assetId: number;
  geom: Uint8Array;
  isRevised: boolean;
}

interface Geometries {
  areas: GeometryTransfer[];
  locations: GeometryTransfer[];
  traces: GeometryTransfer[];
}
