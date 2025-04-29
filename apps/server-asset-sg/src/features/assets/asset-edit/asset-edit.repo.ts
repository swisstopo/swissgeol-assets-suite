import { decodeError, isNotNull } from '@asset-sg/core';
import { AssetEditDetail, AssetUsage, dateFromDateId, DateIdFromDate, PatchAsset } from '@asset-sg/shared';
import { User } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

import { PrismaService } from '@/core/prisma.service';
import { Repo, RepoListOptions } from '@/core/repo';
import { AssetEditDetailFromPostgres } from '@/features/assets/asset-edit/models/asset-edit-detail';
import {
  createStudies,
  deleteStudies,
  postgresStudiesByAssetId,
  updateStudies,
} from '@/features/assets/asset-edit/utils/postgres-studies';
import { FileRepo } from '@/features/assets/files/file.repo';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class AssetEditRepo implements Repo<AssetEditDetail, number, AssetEditData> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileRepo: FileRepo,
  ) {}

  async find(id: number): Promise<AssetEditDetail | null> {
    const asset = await this.prismaService.asset.findUnique({
      where: { assetId: id },
      select: selectPrismaAsset,
    });
    if (asset === null) {
      return null;
    }
    return this.loadDetail(asset);
  }

  async list({ limit, offset, ids }: RepoListOptions<number> = {}): Promise<AssetEditDetail[]> {
    const assets = await this.prismaService.asset.findMany({
      select: selectPrismaAsset,
      where:
        ids == null
          ? undefined
          : {
              assetId: { in: ids },
            },
      take: limit,
      skip: offset,
    });
    return await Promise.all(assets.map((it) => this.loadDetail(it)));
  }

  async create(data: AssetEditData): Promise<AssetEditDetail> {
    return this.prismaService.$transaction(async () => {
      const asset = await this.prismaService.asset.create({
        select: { assetId: true },
        data: {
          titlePublic: data.patch.titlePublic,
          titleOriginal: data.patch.titleOriginal,
          createDate: DateIdFromDate.encode(data.patch.createDate),
          receiptDate: DateIdFromDate.encode(data.patch.receiptDate),
          assetKindItem: { connect: { assetKindItemCode: data.patch.assetKindItemCode } },
          assetFormatItem: { connect: { assetFormatItemCode: data.patch.assetFormatItemCode } },
          isExtract: false,
          isNatRel: data.patch.isNatRel,
          lastProcessedDate: new Date(),
          processor: data.user.email,
          manCatLabelRefs: {
            createMany: {
              data: data.patch.manCatLabelRefs.map((manCatLabelItemCode) => ({
                manCatLabelItemCode,
              })),
              skipDuplicates: true,
            },
          },
          assetContacts: {
            createMany: { data: data.patch.assetContacts, skipDuplicates: true },
          },
          assetLanguages: {
            createMany: { data: data.patch.assetLanguages, skipDuplicates: true },
          },
          ids: {
            createMany: {
              data: data.patch.ids.map(({ id, description }) => ({ id, description })),
            },
          },
          typeNatRels: {
            createMany: {
              data: data.patch.typeNatRels.map((natRelItemCode) => ({ natRelItemCode })),
              skipDuplicates: true,
            },
          },
          internalUse: {
            create: makeUsageInput(data.patch.internalUse),
          },
          publicUse: {
            create: makeUsageInput(data.patch.publicUse),
          },
          statusWorks: {
            create: {
              statusWorkDate: new Date(),
              statusWorkItemCode: 'initiateAsset',
            },
          },
          workgroup: { connect: { id: data.patch.workgroupId } },
          creator: {
            connect: {
              id: data.user.id,
            },
          },
          workflow: {
            create: {
              reviewedTabs: { create: {} },
              publishedTabs: { create: {} },
              assignee: { connect: { id: data.user.id } },
            },
          },
        },
      });
      return (await this.find(asset.assetId)) as AssetEditDetail;
    });
  }

  async update(id: number, data: AssetEditData): Promise<AssetEditDetail | null> {
    // Check if a record for `id` exists, and return `null` if not.
    const count = await this.prismaService.asset.count({ where: { assetId: id } });
    if (count === 0) {
      return null;
    }
    // Run the update in a transaction, as it consists of multiple prisma queries.
    // Note that all mutations within this transaction are no-ops if there is no asset for `id`.
    await this.prismaService.$transaction(async () => {
      // Update the asset.
      // For any relation, delete the existing records, and insert the updated ones.
      await this.prismaService.asset.update({
        where: { assetId: id },
        data: {
          titlePublic: data.patch.titlePublic,
          titleOriginal: data.patch.titleOriginal,
          createDate: DateIdFromDate.encode(data.patch.createDate),
          receiptDate: DateIdFromDate.encode(data.patch.receiptDate),
          assetKindItemCode: data.patch.assetKindItemCode,
          assetFormatItemCode: data.patch.assetFormatItemCode,
          isNatRel: data.patch.isNatRel,
          assetMainId: O.toNullable(data.patch.assetMainId),
          lastProcessedDate: new Date(),
          processor: data.user.email,
          manCatLabelRefs: {
            deleteMany: {},
            createMany: {
              data: data.patch.manCatLabelRefs.map((manCatLabelItemCode) => ({
                manCatLabelItemCode,
              })),
              skipDuplicates: true,
            },
          },
          assetContacts: {
            deleteMany: {},
            createMany: { data: data.patch.assetContacts, skipDuplicates: true },
          },
          assetLanguages: {
            deleteMany: {},
            createMany: { data: data.patch.assetLanguages, skipDuplicates: true },
          },
          assetFiles: {
            update: data.patch.assetFiles.map((it) => ({
              data: {
                file: {
                  update: {
                    ...it,
                  },
                },
              },
              where: { assetId_fileId: { assetId: id, fileId: it.id } },
            })),
          },
          ids: {
            deleteMany: {
              idId: {
                notIn: data.patch.ids.map((it) => O.toNullable(it.idId)).filter(isNotNull),
              },
            },
            upsert: [
              ...data.patch.ids
                .map((it) => ({ ...it, idId: O.toNullable(it.idId) }))
                .filter((it): it is PatchAsset['ids'][0] & { idId: number } => it.idId !== null)
                .map((it) => ({ where: { idId: it.idId }, create: it, update: it })),

              ...data.patch.ids
                .filter((it) => O.isNone(it.idId))
                .map((it) => ({
                  where: { idId: -1 },
                  create: { id: it.id, description: it.description },
                  update: {},
                })),
            ],
          },
          typeNatRels: {
            deleteMany: {},
            createMany: {
              data: data.patch.typeNatRels.map((natRelItemCode) => ({ natRelItemCode })),
              skipDuplicates: true,
            },
          },
          statusWorks: {
            create: O.isSome(data.patch.newStatusWorkItemCode)
              ? {
                  statusWorkDate: new Date(),
                  statusWorkItemCode: data.patch.newStatusWorkItemCode.value,
                }
              : [],
          },
          workgroupId: data.patch.workgroupId,
        },
      });

      // Delete any existing sibling mappings and insert the updated ones.
      await this.prismaService.assetXAssetY.deleteMany({
        where: { OR: [{ assetXId: id }, { assetYId: id }] },
      });
      await this.prismaService.assetXAssetY.createMany({
        data: data.patch.siblingAssetIds.map((assetYId) => ({ assetXId: id, assetYId })),
        skipDuplicates: true,
      });

      // Update the many-to-one relations of the asset.
      // These can't be combined with the other updates, so we run them in a separate query.
      await this.prismaService.asset.update({
        where: { assetId: id },
        data: {
          internalUse: {
            update: makeUsageInput(data.patch.internalUse),
          },
          publicUse: {
            update: makeUsageInput(data.patch.publicUse),
          },
        },
      });

      // For now, handling of studies is passed to the pre-existing functions.
      // We probably want to refactor them too, at some point.
      // (DVA, 2024-04-24)

      // Delete the studies that are missing from the updated data.
      // Note that the ids that we're passing to `deleteStudies` are **not** the ones that are deleted,
      // but instead the ones that are being preserved.
      await deleteStudies(
        this.prismaService,
        id,
        data.patch.studies.map((it) => it.studyId),
      )();

      // Update the asset's old studies that are still present in the update.
      await updateStudies(this.prismaService, data.patch.studies)();

      // Create the studies that do no exist yet.
      await createStudies(this.prismaService, id, data.patch.newStudies)();
    });

    // Load the now-modified asset.
    // We theoretically have all the updated asset's data after updating it,
    // but stitching it together is quite hard and prone to errors.
    // We fully skip that risk by just using `find` instead of manually handling the data.
    return this.find(id);
  }

  async delete(id: number): Promise<boolean> {
    // Check if a record for `id` exists, and return `false` if not.
    const count = await this.prismaService.asset.count({ where: { assetId: id } });
    if (count === 0) {
      return false;
    }

    try {
      await this.prismaService.$transaction(async () => {
        // Delete the record's `file` records.
        const assetFileIds = await this.prismaService.assetFile.findMany({
          where: { assetId: id },
          select: { fileId: true },
        });

        for (const { fileId } of assetFileIds) {
          await this.fileRepo.delete({ id: fileId, assetId: id });
        }

        // Delete the record.
        await this.prismaService.asset.delete({ where: { assetId: id } });

        // Delete all `internalUse` records that are not in use anymore.
        await this.prismaService.internalUse.deleteMany({
          where: {
            Asset: { none: {} },
          },
        });

        // Delete all `publicUse` records that are not in use anymore.
        await this.prismaService.publicUse.deleteMany({
          where: {
            Asset: { none: {} },
          },
        });

        // Delete all `tabStatus` records that are not in use anymore.
        await this.prismaService.tabStatus.deleteMany({
          where: {
            workflowPublish: null,
            workflowReview: null,
          },
        });
      });
      return true;
    } catch (e) {
      return handlePrismaMutationError(e) ?? false;
    }
  }

  private async loadDetail(asset: PrismaAsset): Promise<AssetEditDetail> {
    const studiesResult = await postgresStudiesByAssetId(this.prismaService, asset.assetId)();
    if (E.isLeft(studiesResult)) {
      throw new Error(`failed to load studies for asset ${asset.assetId}: ${studiesResult.left}`);
    }

    const detailResult = AssetEditDetailFromPostgres.decode({ ...asset, studies: studiesResult.right });
    if (E.isLeft(detailResult)) {
      const error = decodeError(detailResult.left);
      throw new Error(`failed to decode details from postgres for asset ${asset.assetId}: ${error}`);
    }
    return detailResult.right as AssetEditDetail;
  }
}

/**
 * The data required to create or update an {@link AssetEditDetail}.
 */
export interface AssetEditData {
  patch: PatchAsset;
  user: User;
}

/**
 * Helper function to create a well-typed {@link AssetSelect} without losing context-specific type information.
 * @param value The selection of asset fields.
 */
const selectOnAsset = <T extends Prisma.AssetSelect>(value: T): T => value;

/**
 * The selection of fields on the `asset` table that is required to build an {@link AssetEditDetailFromPostgres}.
 */
const selectPrismaAsset = selectOnAsset({
  assetId: true,
  titlePublic: true,
  titleOriginal: true,
  createDate: true,
  receiptDate: true,
  lastProcessedDate: true,
  processor: true,
  assetKindItemCode: true,
  assetFormatItemCode: true,
  internalUse: true,
  publicUse: true,
  isNatRel: true,
  sgsId: true,
  geolDataInfo: true,
  geolContactDataInfo: true,
  geolAuxDataInfo: true,
  municipality: true,
  ids: true,
  assetContacts: { select: { role: true, contactId: true } },
  assetLanguages: { select: { languageItemCode: true } },
  manCatLabelRefs: { select: { manCatLabelItemCode: true } },
  assetFormatCompositions: { select: { assetFormatItemCode: true } },
  typeNatRels: { select: { natRelItemCode: true } },
  assetMain: { select: { assetId: true, titlePublic: true } },
  subordinateAssets: { select: { assetId: true, titlePublic: true } },
  siblingXAssets: { select: { assetY: { select: { assetId: true, titlePublic: true } } } },
  siblingYAssets: { select: { assetX: { select: { assetId: true, titlePublic: true } } } },
  statusWorks: { select: { statusWorkItemCode: true, statusWorkDate: true } },
  assetFiles: {
    select: {
      file: {
        select: {
          id: true,
          name: true,
          size: true,
          type: true,
          legalDocItemCode: true,
          lastModifiedAt: true,
        },
      },
    },
    orderBy: [{ file: { type: 'asc' } }, { file: { name: 'asc' } }],
  },
  workgroupId: true,
});

/**
 * The type of values selected by {@link selectPrismaAsset}.
 */
type PrismaAsset = Prisma.AssetGetPayload<{ select: typeof selectPrismaAsset }>;

/**
 * The type of the input that creates or updates {@link PrismaAssetUsageInput} records.
 */
type PrismaAssetUsageInput = Prisma.InternalUseUncheckedCreateWithoutAssetInput;

/**
 * Create the {@link PrismaAssetUsageInput} for the given {@link AssetUsage}.
 * @param usage The usage to create or update.
 */
const makeUsageInput = (usage: AssetUsage): PrismaAssetUsageInput => {
  const startAvailabilityDate = O.isNone(usage.startAvailabilityDate)
    ? null
    : dateFromDateId(usage.startAvailabilityDate.value);
  return {
    isAvailable: usage.isAvailable,
    statusAssetUseItemCode: usage.statusAssetUseItemCode,
    startAvailabilityDate,
  };
};
