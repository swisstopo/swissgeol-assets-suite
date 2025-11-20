import { isNotNil } from '@asset-sg/core';
import { run, WorkgroupId } from '@asset-sg/shared/v2';
import {
  Asset,
  AssetContact,
  AssetLanguage,
  AssetSynchronization,
  Contact,
  File,
  Id,
  ManCatLabelRef,
  Prisma,
  PrismaClient,
  TypeNatRel,
  WorkflowSelection as WorkflowSelectionFromPrisma,
} from '@prisma/client';
import { SyncConfig } from './config';
import { log } from './log';

const BATCH_SIZE = 10_000;
const DEFAULT_SYNC_WORKGROUP = 'Sync';

export class SyncExternService {
  private readonly config: SyncConfig;
  private readonly existingContactIds: Map<string, number> = new Map();
  private readonly relationSqls: RelationSqls = { ids: [], assetLanguages: [], manCatLabelRefs: [], typeNatRels: [] };
  private readonly existingFileIds: Map<string, number> = new Map();
  private readonly assetsToSync: AssetToSync[] = [];
  private readonly newAssetToOriginalAsset: Map<number, { originalAssetId: number; originalSgsId: number | null }> =
    new Map();
  private readonly geometries: Geometries = { areas: new Map(), locations: new Map(), traces: new Map() };
  private readonly sourcePrisma: PrismaClient;
  private readonly destinationPrisma: PrismaClient;
  private defaultWorkgroupId!: WorkgroupId;
  private syncAssignee: string | null = null;

  constructor(sourcePrisma: PrismaClient, destinationPrisma: PrismaClient, config: SyncConfig) {
    this.config = config;
    this.sourcePrisma = sourcePrisma;
    this.destinationPrisma = destinationPrisma;
  }

  /**
   * Synchronizes assets from an external source to the internal, matching potentially existing objects.
   *
   * Does not synchronize the following:
   * - Authors (external sources should not have matching authors, since that's the purpose of external apps)
   * - Favourites (external users should not have access to internal data)
   * - Workflows (we create new workflows with a default message for imported data)
   * - SiblingY are not synchronized (we only synchronize SiblingX, so we do not perform a lookup for potentially missing SiblingY links in future synchronizations)
   */
  public async syncExternalToInternal() {
    log('Starting data export from external');
    await this.init();

    if (this.assetsToSync.length === 0) {
      log('No assets to sync, exiting');
      return;
    }

    log(`Starting synchronization of ${this.assetsToSync.length} assets`);
    this.defaultWorkgroupId = (
      await this.destinationPrisma.workgroup.findFirstOrThrow({
        where: { name: DEFAULT_SYNC_WORKGROUP },
        select: { id: true },
      })
    ).id;
    for (const asset of this.assetsToSync) {
      await this.synchronizeAsset(asset);
      await this.createWorkflowForAsset(asset);
    }
    log(`Synced ${this.newAssetToOriginalAsset.size} assets`);

    const assetSynchronizations = await this.createAssetSynchronizationRecords();
    await this.createRelationTables();
    await this.createGeometriesForAssets();
    await this.createSiblings(assetSynchronizations);
    log('Data export to extern completed');
  }

  private async synchronizeAsset(asset: AssetToSync) {
    const contactsCreate = await this.createContactsPayload(asset.assetContacts);
    const filesCreate = await this.createFilesPayload(asset.assetFiles);

    const workgroup = await this.destinationPrisma.workgroup.findFirst({
      where: { name: { equals: asset.workgroupName } },
      select: { id: true },
    });
    const workgroupId = workgroup?.id ?? this.defaultWorkgroupId;

    const newAsset = await this.destinationPrisma.asset.create({
      include: { assetFiles: { include: { file: true } }, assetContacts: { include: { contact: true } } },
      data: {
        ...asset.asset,
        creatorId: this.syncAssignee,
        assetMainId: null, // this will be set afterwards
        isPublic: asset.asset.isPublic,
        restrictionDate: asset.asset.restrictionDate,
        assetFiles: filesCreate,
        assetContacts: contactsCreate.createData,
        workgroupId,
      },
    });

    // since contacts and files _might_ be created, we just override the entries in the map regardless of whether they existed or not
    newAsset.assetContacts
      .map((a) => a.contact)
      .forEach((c) => {
        this.existingContactIds.set(this.createUniqueContactKey(c), c.contactId);
      });
    newAsset.assetFiles.map((a) => a.file).forEach((f) => this.existingFileIds.set(f.name, f.id));

    await this.destinationPrisma.assetContact.createMany({
      data: [...contactsCreate.assignAfterwards.entries()].map(
        ([uniqueKey, { role }]): Prisma.AssetContactCreateManyInput => ({
          role,
          assetId: newAsset.assetId,
          contactId: run(() => {
            const id = this.existingContactIds.get(uniqueKey);
            if (id === undefined) {
              throw new Error(`Missing contactId for ${uniqueKey}`);
            }
            return id;
          }),
        }),
      ),
    });

    this.newAssetToOriginalAsset.set(newAsset.assetId, {
      originalAssetId: asset.originalAssetId,
      originalSgsId: asset.originalSgsId,
    });

    this.relationSqls.ids.push(...asset.ids.map((i) => Prisma.sql`(${newAsset.assetId}, ${i.id}, ${i.description})`));
    this.relationSqls.assetLanguages.push(
      ...asset.assetLanguages.map((a) => Prisma.sql`(${newAsset.assetId}, ${a.languageItemCode})`),
    );
    this.relationSqls.manCatLabelRefs.push(
      ...asset.manCatLabelRefs.map((m) => Prisma.sql`(${newAsset.assetId}, ${m.manCatLabelItemCode})`),
    );
    this.relationSqls.typeNatRels.push(
      ...asset.typeNatRels.map((t) => Prisma.sql`(${newAsset.assetId}, ${t.natRelItemCode})`),
    );
  }

  /**
   * Creates a lookup key for storing contact ids for easy retrieval so we don't have to fetch potentially existing
   * contacts for each entry we want to create.
   */
  private createUniqueContactKey(contact: Omit<Contact, 'contactId'>): string {
    return `${contact.name}||${contact.locality}||${contact.street}||${contact.country}||${contact.street}||${contact.plz}||${contact.email}||${contact.houseNumber}||${contact.website}||${contact.telephone}`;
  }

  private async createSiblings(assetSynchronizations: AssetSynchronization[]) {
    log('Syncing siblings');
    const existingSiblings = await this.sourcePrisma.assetXAssetY.findMany({
      where: { assetXId: { in: this.assetsToSync.map((a) => a.originalAssetId) } },
    });
    const allSynchronisations = await this.destinationPrisma.assetSynchronization.findMany();
    for (const asset of this.assetsToSync) {
      const newAssetId = assetSynchronizations.find((n) => n.originalAssetId === asset.originalAssetId);
      if (newAssetId === undefined) {
        throw new Error(`Could not find new asset id for asset ${asset.originalAssetId}`);
      }

      const assetMainLink = allSynchronisations.find((n) => n.originalAssetId === asset.asset.assetMainId);
      const originalAssetXSiblings = existingSiblings
        .filter((n) => n.assetXId === asset.originalAssetId)
        .map((n) => n.assetYId);
      const newAssetSiblings = allSynchronisations
        .filter((n) => originalAssetXSiblings.includes(n.originalAssetId))
        .map((n) => n.assetId);

      await this.destinationPrisma.asset.update({
        where: { assetId: newAssetId.assetId },
        data: {
          assetMainId: assetMainLink?.assetId,
          siblingXAssets: { create: newAssetSiblings.map((n) => ({ assetYId: n })) },
        },
      });
      for (const child of asset.children) {
        const syncedChildAsset = allSynchronisations.find((n) => n.originalAssetId === child.assetId);
        if (syncedChildAsset) {
          await this.destinationPrisma.asset.update({
            where: { assetId: syncedChildAsset.assetId },
            data: {
              assetMainId: newAssetId.assetId,
            },
          });
        }
      }
    }
  }

  private async init() {
    this.syncAssignee = (
      await this.destinationPrisma.assetUser.findFirstOrThrow({
        select: { id: true },
        where: { email: this.config.syncAssignee },
      })
    ).id;

    (await this.destinationPrisma.contact.findMany()).forEach((c) =>
      this.existingContactIds.set(this.createUniqueContactKey(c), c.contactId),
    );

    (await this.destinationPrisma.file.findMany()).forEach((f) => this.existingFileIds.set(f.name, f.id));

    const alreadySyncedIds = (
      await this.destinationPrisma.assetSynchronization.findMany({
        select: { originalAssetId: true },
      })
    ).map((res) => res.originalAssetId);
    log(`Found ${alreadySyncedIds.length} already synced IDs which will be skipped`);

    const assetsToSync: AssetToSync[] = (
      await this.sourcePrisma.asset.findMany({
        where: {
          assetId: {
            notIn: alreadySyncedIds,
          },
          workflow: { status: 'Reviewed' },
        },
        include: {
          subordinateAssets: { select: { assetId: true } },
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
          workgroup: {
            select: { name: true },
          },
          workflow: {
            include: {
              review: true,
            },
          },
        },
      })
    ).map((item) => {
      const {
        assetId,
        sgsId,
        assetFiles,
        assetContacts,
        manCatLabelRefs,
        typeNatRels,
        ids,
        assetLanguages,
        workgroup,
        subordinateAssets,
        workflow,
        ...asset
      } = item;
      if (workflow === null) {
        throw new Error(`Can't sync asset without workflow: ${assetId}`);
      }
      return {
        asset,
        workgroupName: workgroup.name,
        manCatLabelRefs,
        assetLanguages,
        typeNatRels,
        ids,
        assetContacts: assetContacts,
        assetFiles: assetFiles.flatMap((a) => a.file),
        originalAssetId: assetId,
        originalSgsId: sgsId,
        children: subordinateAssets,
        reviewSelection: workflow.review,
      };
    });
    this.assetsToSync.push(...assetsToSync);
    log(`Found ${this.assetsToSync.length} assets in source database which need to be synced`);

    if (assetsToSync.length > 0) {
      this.geometries.traces = await this.fetchExistingGeometriesForAssets('trace');
      this.geometries.areas = await this.fetchExistingGeometriesForAssets('area');
      this.geometries.locations = await this.fetchExistingGeometriesForAssets('location');
      log(`Fetched original geometries for assets to sync`);
    }
  }

  /**
   * Creates an input for asset contacts by either connecting to existing contacts or by creating a new contact.
   * Since there is an edge case where an asset has a relation to the same contact that is newly created, we also need
   * to keep a list of these references as they need to be added after the creation; otherwise, this contact is
   * duplicated.
   */
  private async createContactsPayload(
    assetContacts: (AssetContact & { contact: Contact })[], // prettier-ignore
  ): Promise<{
    assignAfterwards: Map<string, { role: string }>;
    createData: Prisma.AssetContactUncheckedCreateNestedManyWithoutAssetInput;
  }> {
    const newlyAddedContactKeys: Set<string> = new Set();
    const assignAfterwards: Map<string, { role: string }> = new Map();
    const createData = {
      create: assetContacts
        .map(({ role, contact: { contactId: _, ...contact } }) => {
          const uniqueContactKey = this.createUniqueContactKey(contact);
          const match = this.existingContactIds.get(uniqueContactKey);
          if (!match) {
            if (newlyAddedContactKeys.has(uniqueContactKey)) {
              assignAfterwards.set(uniqueContactKey, { role });
              return;
            } else {
              newlyAddedContactKeys.add(uniqueContactKey);
              return {
                role,
                contact: { create: contact },
              };
            }
          }
          return {
            role,
            contact: { connect: { contactId: match } },
          };
        })
        .filter(isNotNil),
    };

    return { assignAfterwards, createData };
  }

  /**
   * Creates an input for asset files by either connecting to existing files (matched by name) or by creating a new file
   * entry.
   */
  private async createFilesPayload(
    assetFiles: File[],
  ): Promise<Prisma.AssetFileUncheckedCreateNestedManyWithoutAssetInput> {
    const create = assetFiles.map(({ id: _, ...file }) => {
      const match = this.existingFileIds.get(file.name);

      return match
        ? { file: { connect: { id: match } } }
        : ({
            file: {
              create: { ...file, pageRangeClassifications: file.pageRangeClassifications as Prisma.InputJsonValue },
            },
          } satisfies Prisma.AssetFileCreateWithoutAssetInput);
    });

    return { create };
  }

  private async fetchExistingGeometriesForAssets(
    tableType: 'area' | 'location' | 'trace',
  ): Promise<StudyGeometriesPerAsset> {
    const assetIds = this.assetsToSync.map((a) => a.originalAssetId);
    const query = `SELECT study_${tableType}_id AS "id", asset_id AS "assetId",
                          ST_ASBINARY(geom) AS "geom",
                          is_revised        AS "isRevised"
                   FROM study_${tableType}
                   WHERE asset_id IN (${assetIds.join(',')})
    `;

    const result = await this.sourcePrisma.$queryRawUnsafe<StudyGeometry[]>(query);
    const resultSet = new Map<number, StudyGeometryTransfer[]>();

    result.forEach(({ assetId, ...data }) => {
      if (!resultSet.has(assetId)) {
        resultSet.set(assetId, [data]);
      } else {
        resultSet.get(assetId)?.push(data);
      }
    });

    return resultSet;
  }

  private async createGeometriesForAssets() {
    log('Begin geometry insert');
    const buildRows = <T extends { geom: Uint8Array | string; isRevised: boolean }>(list: T[], newAssetId: number) =>
      list.map(({ geom, isRevised }) => Prisma.sql`(${newAssetId}, ST_GeomFromWKB(${geom}), ${isRevised})`);

    const areasSql: Prisma.Sql[] = [];
    const locationsSql: Prisma.Sql[] = [];
    const tracesSql: Prisma.Sql[] = [];
    this.newAssetToOriginalAsset.forEach(({ originalAssetId }, newAssetId) => {
      areasSql.push(...buildRows(this.geometries.areas.get(originalAssetId) ?? [], newAssetId));
      locationsSql.push(...buildRows(this.geometries.locations.get(originalAssetId) ?? [], newAssetId));
      tracesSql.push(...buildRows(this.geometries.traces.get(originalAssetId) ?? [], newAssetId));
    });

    for (const [idx, batch] of this.batchList(areasSql, BATCH_SIZE).entries()) {
      log(`Creating batch #${idx + 1} of areas`, 'batch');
      await this.destinationPrisma.$executeRaw`
        INSERT INTO study_area (asset_id, geom, is_revised)
        VALUES ${Prisma.join(batch)}
      `;
      log(`Finished batch #${idx + 1} of areas`, 'batch');
    }

    for (const [idx, batch] of this.batchList(locationsSql, BATCH_SIZE).entries()) {
      log(`Creating batch #${idx + 1} of locations`, 'batch');
      await this.destinationPrisma.$executeRaw`
        INSERT INTO study_location (asset_id, geom, is_revised)
        VALUES ${Prisma.join(batch)}
      `;
      log(`Finished batch #${idx + 1} of locations`, 'batch');
    }

    for (const [idx, batch] of this.batchList(tracesSql, BATCH_SIZE).entries()) {
      log(`Creating batch #${idx + 1} of traces`, 'batch');
      await this.destinationPrisma.$executeRaw`
        INSERT INTO study_trace (asset_id, geom, is_revised)
        VALUES ${Prisma.join(batch)}
      `;
      log(`Finished batch #${idx + 1} of traces`, 'batch');
    }
  }

  private batchList<T>(list: T[], batchSize: number): T[][] {
    const batches = [];
    for (let i = 0; i < list.length; i += batchSize) {
      batches.push(list.slice(i, i + batchSize));
    }
    return batches;
  }

  private async createRelationTables() {
    log('Create batched relation entries');
    for (const [idx, batch] of this.batchList(this.relationSqls.ids, BATCH_SIZE).entries()) {
      log(`Creating batch #${idx + 1} of ids`, 'batch');
      await this.destinationPrisma.$executeRaw`
        INSERT INTO id (asset_id, id, description)
        VALUES ${Prisma.join(batch)}
      `;
      log(`Finished batch #${idx + 1} of ids`, 'batch');
    }

    for (const [idx, batch] of this.batchList(this.relationSqls.assetLanguages, BATCH_SIZE).entries()) {
      log(`Creating batch #${idx + 1} of asset languages`, 'batch');
      await this.destinationPrisma.$executeRaw`
        INSERT INTO asset_language (asset_id, language_item_code)
        VALUES ${Prisma.join(batch)}
      `;
      log(`Finished batch #${idx + 1} of asset languages`, 'batch');
    }

    for (const [idx, batch] of this.batchList(this.relationSqls.manCatLabelRefs, BATCH_SIZE).entries()) {
      log(`Creating batch #${idx + 1} of mancatlabelrefs`, 'batch');
      await this.destinationPrisma.$executeRaw`
        INSERT INTO man_cat_label_ref (asset_id, man_cat_label_item_code)
        VALUES ${Prisma.join(batch)}
      `;
      log(`Finished batch #${idx + 1} of mancatlabelrefs`, 'batch');
    }

    for (const [idx, batch] of this.batchList(this.relationSqls.typeNatRels, BATCH_SIZE).entries()) {
      log(`Creating batch #${idx + 1} of typeNatRels`, 'batch');
      await this.destinationPrisma.$executeRaw`
        INSERT INTO type_nat_rel (asset_id, nat_rel_item_code)
        VALUES ${Prisma.join(batch)}
      `;
      log(`Finished batch #${idx + 1} of typeNatRels`, 'batch');
    }
  }

  private async createWorkflowForAsset(asset: AssetToSync) {
    log(`Create workflow for asset with original ID ${asset.originalAssetId}`);
    const { id: _id, ...selection } = asset.reviewSelection;
    const reviewSelection = await this.destinationPrisma.workflowSelection.create({
      select: { id: true },
      data: {
        ...selection,
      },
    });
    const approvalSelection = await this.destinationPrisma.workflowSelection.create({ select: { id: true }, data: {} });

    // Find the new asset id by looking up the original asset id in the map
    const newAssetId = Array.from(this.newAssetToOriginalAsset.entries()).find(
      ([_, v]) => v.originalAssetId === asset.originalAssetId,
    )?.[0];

    if (newAssetId === undefined) {
      throw new Error(`Could not find new asset id for original asset id ${asset.originalAssetId}`);
    }

    const workflow = await this.destinationPrisma.workflow.create({
      select: { id: true },
      data: {
        id: newAssetId,
        status: 'Reviewed',
        assigneeId: this.syncAssignee,
        reviewId: reviewSelection.id,
        approvalId: approvalSelection.id,
      },
    });

    const { id: workflowId } = workflow;
    await this.destinationPrisma.workflowChange.create({
      data: {
        workflowId: workflowId,
        comment: `Synchronized from EXTERN with original ID ${asset.originalAssetId}`,
        fromStatus: 'Draft',
        toStatus: 'Reviewed',
        toAssigneeId: this.syncAssignee,
      },
    });
  }

  private async createAssetSynchronizationRecords(): Promise<Prisma.AssetSynchronizationGetPayload<object>[]> {
    log('Create synchronization records');
    return this.destinationPrisma.assetSynchronization.createManyAndReturn({
      data: Array.from(this.newAssetToOriginalAsset.entries()).map((a) => ({
        assetId: a[0],
        originalAssetId: a[1].originalAssetId,
        originalSgsId: a[1].originalSgsId,
      })),
    });
  }
}

interface StudyGeometry {
  id: number;
  assetId: number;
  geom: Uint8Array;
  isRevised: boolean;
}

type StudGeometryId = StudyGeometry['assetId'];

type StudyGeometryTransfer = Omit<StudyGeometry, 'assetId'>;

type StudyGeometriesPerAsset = Map<StudGeometryId, StudyGeometryTransfer[]>;

interface Geometries {
  areas: StudyGeometriesPerAsset;
  locations: StudyGeometriesPerAsset;
  traces: StudyGeometriesPerAsset;
}

interface RelationSqls {
  ids: Prisma.Sql[];
  assetLanguages: Prisma.Sql[];
  manCatLabelRefs: Prisma.Sql[];
  typeNatRels: Prisma.Sql[];
}

interface AssetToSync {
  asset: Omit<Asset, 'assetId' | 'sgsId'>;
  workgroupName: string;
  originalAssetId: Asset['assetId'];
  originalSgsId: Asset['sgsId'];
  assetFiles: File[];
  assetContacts: (AssetContact & { contact: Contact })[];
  manCatLabelRefs: Pick<ManCatLabelRef, 'manCatLabelItemCode'>[];
  typeNatRels: Pick<TypeNatRel, 'natRelItemCode'>[];
  ids: Pick<Id, 'id' | 'description'>[];
  assetLanguages: Pick<AssetLanguage, 'languageItemCode'>[];
  reviewSelection: WorkflowSelectionFromPrisma;
  children: Array<{ assetId: number }>;
}
