import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/core/prisma.service';
import { Repo, RepoListOptions } from '@/core/repo';
import {
  Asset,
  AssetData,
  AssetId,
  AssetUsage,
  AssetStudy,
  StudyData,
  AssetStudyId,
} from '@/features/assets/asset.model';
import { assetSelection, parseAssetFromPrisma } from '@/features/assets/prisma-asset';
import { StudyType } from '@/features/studies/study.model';
import { User } from '@/features/users/user.model';
import { isNotPersisted, isPersisted } from '@/utils/data/model';
import { satisfy } from '@/utils/define';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class AssetRepo implements Repo<Asset, AssetId, FullAssetData> {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: AssetId): Promise<Asset | null> {
    const entry = await this.prisma.asset.findFirst({
      where: { assetId: id },
      select: assetSelection,
    });
    return entry == null ? null : parseAssetFromPrisma(entry);
  }

  async list({ limit, offset, ids }: RepoListOptions<AssetId> = {}): Promise<Asset[]> {
    const entries = await this.prisma.asset.findMany({
      where:
        ids == null
          ? undefined
          : {
              assetId: { in: ids },
            },
      select: assetSelection,
      take: limit,
      skip: offset,
    });
    return entries.map(parseAssetFromPrisma);
  }

  async create(data: FullAssetData): Promise<Asset> {
    const id = await this.prisma.$transaction(async () => {
      const { assetId } = await this.prisma.asset.create({
        data: mapDataToPrismaCreate(data),
        select: { assetId: true },
      });
      await this.manageStudies(assetId, data.studies);
      return assetId;
    });
    return (await this.find(id)) as Asset;
  }

  async update(id: AssetId, data: FullAssetData): Promise<Asset | null> {
    try {
      return await this.prisma.$transaction(async () => {
        await this.manageStudies(id, data.studies);
        const entry = await this.prisma.asset.update({
          where: { assetId: id },
          data: mapDataToPrismaUpdate(id, data),
          select: assetSelection,
        });
        return parseAssetFromPrisma(entry);
      });
    } catch (e) {
      return handlePrismaMutationError(e);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.$transaction(async () => {
        // Delete the record's `manCatLabelRef` records.
        await this.prisma.manCatLabelRef.deleteMany({
          where: { assetId: id },
        });

        // Delete the record's `assetContact` records.
        await this.prisma.assetContact.deleteMany({
          where: { assetId: id },
        });

        // Delete the record's `assetLanguage` records.
        await this.prisma.assetLanguage.deleteMany({
          where: { assetId: id },
        });

        // Delete the record's `id` records.
        await this.prisma.id.deleteMany({
          where: { assetId: id },
        });

        // Delete the record's `typeNatRel` records.
        await this.prisma.typeNatRel.deleteMany({
          where: { assetId: id },
        });

        // Delete the record's `statusWork` records.
        await this.prisma.statusWork.deleteMany({
          where: { assetId: id },
        });

        // Delete the record.
        await this.prisma.asset.delete({ where: { assetId: id } });

        // Delete all `internalUse` records that are not in use anymore.
        await this.prisma.internalUse.deleteMany({
          where: {
            Asset: { none: {} },
          },
        });

        // Delete all `publicUse` records that are not in use anymore.
        await this.prisma.publicUse.deleteMany({
          where: {
            Asset: { none: {} },
          },
        });
      });
      return true;
    } catch (e) {
      return handlePrismaMutationError(e) ?? false;
    }
  }

  private async manageStudies(assetId: AssetId, data: (AssetStudy | StudyData)[]): Promise<void> {
    const studiesToCreate: Partial<Record<StudyType, StudyData[]>> = {};
    const studiesToUpdate: Partial<Record<StudyType, AssetStudy[]>> = {};
    for (const study of data) {
      if (isPersisted(study)) {
        (studiesToUpdate[study.type] ??= []).push(study);
      } else {
        (studiesToCreate[study.type] ??= []).push(study);
      }
    }
    for (const [type, studies] of Object.entries(studiesToUpdate) as Array<[StudyType, AssetStudy[]]>) {
      await this.deleteStudies(
        assetId,
        type,
        studies.map((it) => it.id)
      );
      await this.updateStudies(assetId, type, studies);
    }
    for (const [type, studies] of Object.entries(studiesToCreate) as Array<[StudyType, StudyData[]]>) {
      await this.createStudies(assetId, type, studies);
    }
  }

  private async deleteStudies(assetId: AssetId, type: StudyType, knownIds: AssetStudyId[]): Promise<void> {
    const condition =
      knownIds.length === 0 ? '' : Prisma.sql`AND study_${Prisma.raw(type)}_id NOT IN (${Prisma.join(knownIds, ',')})`;
    await this.prisma.$queryRaw`
      DELETE
      FROM public.study_${type}
      WHERE assetId = ${assetId} ${condition}
    `;
  }

  private async createStudies(assetId: AssetId, type: StudyType, data: StudyData[]): Promise<void> {
    if (data.length === 0) {
      return;
    }
    const values = data.map(
      (it) => Prisma.sql`
      (${assetId}, 'unkown', st_geomfromtext('${it.geom}', 2056))
    `
    );
    await this.prisma.$queryRaw`
      INSERT INTO public.study_${type}
        (asset_id, geom_quality_item_code, geom)
      VALUES
        ${Prisma.join(values, ',')}
    `;
  }

  private async updateStudies(assetId: AssetId, type: StudyType, data: AssetStudy[]): Promise<void> {
    if (data.length === 0) {
      return;
    }
    // TODO does this work?
    const cases = data.map(
      (it) => Prisma.sql`
      WHEN study_${Prisma.raw(type)}_id = ${it.id}
      THEN ${it.geom}
    `
    );
    await this.prisma.$queryRaw`
      UPDATE
        public.study_${type}
      SET geom =
            CASE
              ${Prisma.join(cases, '\n')}
              ELSE geom
      WHERE assetId = ${assetId}
    `;
  }
}

interface FullAssetData extends AssetData {
  processor: User;
}

const mapDataToPrisma = (data: FullAssetData) =>
  satisfy<Partial<Prisma.AssetCreateInput & Prisma.AssetUpdateInput>>()({
    titlePublic: data.title,
    titleOriginal: data.originalTitle,
    processor: data.processor.email,
    createDate: data.createdAt.toDate(),
    receiptDate: data.receivedAt.toDate(),
    lastProcessedDate: new Date(),
    isNatRel: data.isNatRel,
    assetKindItem: {
      connect: {
        assetKindItemCode: data.kindCode,
      },
    },
    assetFormatItem: {
      connect: {
        assetFormatItemCode: data.formatCode,
      },
    },
    workgroup: data.workgroupId
      ? {
          connect: {
            id: data.workgroupId,
          },
        }
      : undefined,
  });

const mapDataToPrismaCreate = (data: FullAssetData): Prisma.AssetCreateInput => ({
  ...mapDataToPrisma(data),
  isExtract: false,
  assetMain:
    data.links.parent == null
      ? undefined
      : {
          connect: {
            assetId: data.links.parent,
          },
        },
  manCatLabelRefs: {
    createMany: {
      data: data.manCatLabelCodes.map((code) => ({
        manCatLabelItemCode: code,
      })),
      skipDuplicates: true,
    },
  },
  assetContacts: {
    createMany: {
      data: data.contactAssignments.map((it) => ({
        contactId: it.contactId,
        role: it.role,
      })),
      skipDuplicates: true,
    },
  },
  assetLanguages: {
    createMany: {
      data: data.languageCodes.map((code) => ({
        languageItemCode: code,
      })),
      skipDuplicates: true,
    },
  },
  ids: {
    createMany: {
      data: data.identifiers.map((it) => ({
        id: it.name,
        description: it.description,
      })),
      skipDuplicates: true,
    },
  },
  typeNatRels: {
    createMany: {
      data: data.natRelCodes.map((code) => ({
        natRelItemCode: code,
      })),
      skipDuplicates: true,
    },
  },
  statusWorks: {
    createMany: {
      data: data.statuses.map((it) => ({
        statusWorkId: isPersisted(it) ? it.id : undefined,
        statusWorkDate: it.createdAt,
        statusWorkItemCode: it.itemCode,
      })),
      skipDuplicates: true,
    },
  },
  publicUse: {
    create: makeUsageInput(data.usage.public),
  },
  internalUse: {
    create: makeUsageInput(data.usage.internal),
  },

  // In the mapping of this repo,
  // `siblingYAssets` contains mappings to siblings whose `id` is greater than our own,
  // while `siblingXAssets` contains the mappings where our `id` is greater.
  // This guarantees that we have no duplicate siblings by ensuring that `x > y` for all siblings.
  // As ids increment, we know that any siblings present here will have an `id` lesser than
  // the asset that we are creating here.
  // This means we can simply put all siblings into `siblingXAssets`.
  siblingXAssets: {
    createMany: {
      data: data.links.siblings.map((siblingId) => ({
        assetYId: siblingId,
      })),
      skipDuplicates: true,
    },
  },
});

const mapDataToPrismaUpdate = (id: AssetId, data: FullAssetData): Prisma.AssetUpdateInput => ({
  ...mapDataToPrisma(data),
  assetMain:
    data.links.parent == null
      ? { disconnect: true }
      : {
          connect: { assetId: data.links.parent },
        },
  manCatLabelRefs: {
    deleteMany: {
      assetId: id,
      manCatLabelItemCode: { notIn: data.manCatLabelCodes },
    },
    createMany: {
      data: data.manCatLabelCodes.map((code) => ({
        manCatLabelItemCode: code,
      })),
      skipDuplicates: true,
    },
  },
  assetContacts: {
    deleteMany: {
      NOT: {
        OR: data.contactAssignments.map((it) => ({
          assetId: id,
          contactId: it.contactId,
          role: it.role,
        })),
      },
    },
    createMany: {
      data: data.contactAssignments.map((it) => ({
        assetId: id,
        contactId: it.contactId,
        role: it.role,
      })),
      skipDuplicates: true,
    },
  },
  assetLanguages: {
    deleteMany: {
      assetId: id,
      languageItemCode: { notIn: data.languageCodes },
    },
    createMany: {
      data: data.languageCodes.map((code) => ({
        languageItemCode: code,
      })),
      skipDuplicates: true,
    },
  },
  ids: {
    deleteMany: {
      assetId: id,
      idId: { notIn: data.identifiers.filter(isPersisted).map((it) => it.id) },
    },
    createMany: {
      data: data.identifiers.filter(isNotPersisted).map((it) => ({
        id: it.name,
        description: it.description,
      })),
      skipDuplicates: true,
    },
    update: data.identifiers.filter(isPersisted).map((it) => ({
      where: {
        idId: it.id,
      },
      data: {
        id: it.name,
        description: it.description,
      },
    })),
  },
  typeNatRels: {
    // Without actually storing the `typeNatRelId` in `data`,
    // there's no way to preserve existing records.
    // This means we always need to delete everything, and recreate afterward.
    deleteMany: {},
    createMany: {
      data: data.natRelCodes.map((code) => ({
        natRelItemCode: code,
      })),
      skipDuplicates: true,
    },
  },
  statusWorks: {
    deleteMany: {
      statusWorkId: { notIn: data.statuses.filter(isPersisted).map((it) => it.id) },
    },
    createMany: {
      data: data.statuses.filter(isNotPersisted).map((it) => ({
        statusWorkDate: it.createdAt,
        statusWorkItemCode: it.itemCode,
      })),
      skipDuplicates: true,
    },
    update: data.statuses.filter(isPersisted).map((it) => ({
      where: {
        statusWorkId: it.id,
      },
      data: {
        id: it.id,
        statusWorkDate: it.createdAt,
        statusWorkItemCode: it.itemCode,
      },
    })),
  },
  publicUse: {
    update: makeUsageInput(data.usage.public),
  },
  internalUse: {
    update: makeUsageInput(data.usage.internal),
  },

  // In the mapping of this repo,
  // `siblingYAssets` contains mappings to siblings whose `id` is greater than our own,
  // while `siblingXAssets` contains the mappings where our `id` is greater.
  // This guarantees that we have no duplicate siblings by ensuring that `x > y` for all siblings.
  siblingXAssets: {
    deleteMany: {
      assetXId: id,
      assetYId: { notIn: data.links.siblings },
    },
    createMany: {
      data: data.links.siblings
        .filter((siblingId) => siblingId < id)
        .map((siblingId) => ({
          assetYId: siblingId,
        })),
      skipDuplicates: true,
    },
  },
  siblingYAssets: {
    deleteMany: {
      assetYId: id,
      assetXId: { notIn: data.links.siblings },
    },
    createMany: {
      data: data.links.siblings
        .filter((siblingId) => siblingId > id)
        .map((siblingId) => ({
          assetXId: siblingId,
        })),
      skipDuplicates: true,
    },
  },
});

/**
 * The type of the input that creates or updates {@link PrismaAssetUsageInput} records.
 */
type PrismaAssetUsageInput = Prisma.InternalUseUncheckedCreateWithoutAssetInput;

/**
 * Create the {@link PrismaAssetUsageInput} for the given {@link AssetUsage}.
 * @param usage The usage to create or update.
 */
const makeUsageInput = (usage: AssetUsage): PrismaAssetUsageInput => {
  return {
    isAvailable: usage.isAvailable,
    statusAssetUseItemCode: usage.statusCode,
    startAvailabilityDate: usage.availableAt?.toDate() ?? null,
  };
};
