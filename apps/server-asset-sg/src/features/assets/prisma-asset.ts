import {
  Asset,
  AssetContactRole,
  AssetData,
  AssetId,
  AssetLegacyData,
  isNotPersisted,
  isPersisted,
  LanguageCode,
  LinkedAsset,
  LocalDate,
  mapWorkflowStatusFromPrisma,
  UpdateAssetData,
} from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';

import { CreateAssetDataWithCreator } from '@/features/assets/asset.model';
import { assetFileSelection, mapAssetFileFromPrisma } from '@/features/assets/files/prisma-file';

export type SelectedAsset = Prisma.AssetGetPayload<{ select: typeof assetSelection }>;
type SelectedLinkedAsset = Prisma.AssetGetPayload<{ select: typeof linkedAssetSelection }>;
type SelectedLegacyData = Prisma.AssetGetPayload<{ select: typeof legacyDataSelection }>;

const linkedAssetSelection = {
  assetId: true,
  titlePublic: true,
} satisfies Prisma.AssetSelect;

const legacyDataSelection = {
  sgsId: true,
  geolDataInfo: true,
  geolContactDataInfo: true,
  geolAuxDataInfo: true,
  municipality: true,
} satisfies Prisma.AssetSelect;

export const assetSelection = {
  assetId: true,
  titlePublic: true,
  titleOriginal: true,
  isNatRel: true,
  isPublic: true,
  restrictionDate: true,

  ...legacyDataSelection,

  assetFormatItemCode: true,
  assetKindItemCode: true,
  assetLanguages: {
    select: {
      languageItemCode: true,
    },
  },
  typeNatRels: {
    select: {
      natRelItemCode: true,
    },
  },
  manCatLabelRefs: {
    select: {
      manCatLabelItemCode: true,
    },
  },
  ids: {
    select: {
      idId: true,
      id: true,
      description: true,
    },
  },
  assetFiles: {
    select: {
      file: {
        select: assetFileSelection,
      },
    },
  },
  assetContacts: {
    select: {
      contactId: true,
      role: true,
    },
  },
  assetMain: {
    select: linkedAssetSelection,
  },
  subordinateAssets: {
    select: linkedAssetSelection,
  },
  siblingXAssets: {
    select: {
      assetY: {
        select: linkedAssetSelection,
      },
    },
  },
  siblingYAssets: {
    select: {
      assetX: {
        select: linkedAssetSelection,
      },
    },
  },

  workgroupId: true,
  creatorId: true,
  createDate: true,
  receiptDate: true,
  workflow: {
    select: {
      status: true,
    },
  },
} satisfies Prisma.AssetSelect;

export const parseAssetFromPrisma = (data: SelectedAsset): Asset => ({
  id: data.assetId,
  title: data.titlePublic,
  originalTitle: data.titleOriginal,
  isOfNationalInterest: data.isNatRel,
  isPublic: data.isPublic,
  restrictionDate: data.restrictionDate ? LocalDate.fromDate(data.restrictionDate) : null,
  legacyData: parseLegacyDataFromPrisma(data),
  formatCode: data.assetFormatItemCode,
  kindCode: data.assetKindItemCode,
  languageCodes: data.assetLanguages.map((it) => it.languageItemCode as LanguageCode),
  nationalInterestTypeCodes: data.typeNatRels.map((it) => it.natRelItemCode),
  topicCodes: data.manCatLabelRefs.map((it) => it.manCatLabelItemCode),
  identifiers: data.ids.map((it) => ({
    id: it.idId,
    value: it.id,
    description: it.description,
  })),
  files: data.assetFiles.map((it) => mapAssetFileFromPrisma(it.file)),
  contacts: data.assetContacts.map((it) => ({
    id: it.contactId,
    role: it.role as AssetContactRole,
  })),
  parent: data.assetMain === null ? null : parseLinkedAsset(data.assetMain),
  children: data.subordinateAssets.map(parseLinkedAsset),
  siblings: [
    ...data.siblingXAssets.map((it) => parseLinkedAsset(it.assetY)),
    ...data.siblingYAssets.map((it) => parseLinkedAsset(it.assetX)),
  ],
  workgroupId: data.workgroupId,
  creatorId: data.creatorId,
  createdAt: LocalDate.fromDate(data.createDate),
  receivedAt: LocalDate.fromDate(data.receiptDate),
  // In Anonymous Mode, Assets do not have a workflow. The previous nonNullAssertion caused the app to crash (see https://github.com/swisstopo/swissgeol-assets-suite/issues/702)
  // We now default to 'Draft' in this case, since we never display the Workflowstatus in the Viewer App and the status is irrelevant.
  workflowStatus: mapWorkflowStatusFromPrisma(data.workflow?.status ?? 'Draft'),
});

const parseLegacyDataFromPrisma = (data: SelectedLegacyData): AssetLegacyData | null => {
  const legacyData: AssetLegacyData = {
    sgsId: data.sgsId,
    data: data.geolDataInfo,
    contactData: data.geolContactDataInfo,
    auxiliaryData: data.geolAuxDataInfo,
    municipality: data.municipality,
  };
  return Object.values(legacyData).every((value) => value == null) ? null : legacyData;
};

const parseLinkedAsset = (data: SelectedLinkedAsset): LinkedAsset => ({
  id: data.assetId,
  title: data.titlePublic,
});

const mapDataToPrisma = (data: AssetData) =>
  ({
    titlePublic: data.title,
    titleOriginal: data.originalTitle,
    isNatRel: data.isOfNationalInterest,
    isPublic: data.isPublic,
    restrictionDate: data.restrictionDate ? data.restrictionDate.toDate() : null,
    assetFormatItem: {
      connect: {
        assetFormatItemCode: data.formatCode,
      },
    },
    assetKindItem: {
      connect: {
        assetKindItemCode: data.kindCode,
      },
    },

    workgroup: {
      connect: {
        id: data.workgroupId,
      },
    },
    createDate: data.createdAt.toDate(),
    receiptDate: data.receivedAt.toDate(),
  }) satisfies Partial<Prisma.AssetCreateInput & Prisma.AssetUpdateInput>;

export const mapAssetDataToPrismaCreate = (data: CreateAssetDataWithCreator): Prisma.AssetCreateInput => ({
  ...mapDataToPrisma(data),
  isExtract: false,
  assetLanguages: {
    createMany: {
      data: data.languageCodes.map((code) => ({
        languageItemCode: code,
      })),
      skipDuplicates: true,
    },
  },
  typeNatRels: {
    createMany: {
      data: data.nationalInterestTypeCodes.map((code) => ({
        natRelItemCode: code,
      })),
      skipDuplicates: true,
    },
  },
  manCatLabelRefs: {
    createMany: {
      data: data.topicCodes.map((code) => ({
        manCatLabelItemCode: code,
      })),
      skipDuplicates: true,
    },
  },
  ids: {
    createMany: {
      data: data.identifiers.map((it) => ({
        id: it.value,
        description: it.description,
      })),
      skipDuplicates: true,
    },
  },
  assetContacts: {
    createMany: {
      data: data.contacts.map((it) => ({
        contactId: it.id,
        role: it.role,
      })),
      skipDuplicates: true,
    },
  },
  assetMain:
    data.parent == null
      ? undefined
      : {
          connect: {
            assetId: data.parent,
          },
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
      data: data.siblings.map((siblingId) => ({
        assetYId: siblingId,
      })),
      skipDuplicates: true,
    },
  },

  creator: {
    connect: {
      id: data.creatorId,
    },
  },

  workflow: {
    create: {
      review: { create: {} },
      approval: { create: {} },
      assignee: { connect: { id: data.creatorId } },
    },
  },
});

export const mapAssetDataToPrismaUpdate = (id: AssetId, data: UpdateAssetData): Prisma.AssetUpdateInput => ({
  ...mapDataToPrisma(data),
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
  typeNatRels: {
    // We can't detect which typeNatRels are already mapped as they use a separate id number which we do not use outside the database.
    // This means we have to delete all rels everytime, and then recreate them.
    deleteMany: {
      assetId: id,
    },
    createMany: {
      data: [...new Set(data.nationalInterestTypeCodes)].map((code) => ({
        natRelItemCode: code,
      })),
    },
  },
  manCatLabelRefs: {
    deleteMany: {
      assetId: id,
      manCatLabelItemCode: { notIn: data.topicCodes },
    },
    createMany: {
      data: data.topicCodes.map((code) => ({
        manCatLabelItemCode: code,
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
        id: it.value,
        description: it.description,
      })),
      skipDuplicates: true,
    },
    update: data.identifiers.filter(isPersisted).map((it) => ({
      where: {
        idId: it.id,
      },
      data: {
        id: it.value,
        description: it.description,
      },
    })),
  },
  assetFiles: {
    deleteMany: {
      assetId: id,
      fileId: {
        notIn: data.files.map((it) => it.id),
      },
    },
    connectOrCreate: data.files.map((it) => ({
      where: { assetId_fileId: { assetId: id, fileId: it.id } },
      create: {
        fileId: it.id,
      },
    })),
    update: data.files.map((it) => ({
      where: { assetId_fileId: { assetId: id, fileId: it.id } },
      data: {
        file: {
          update: {
            legalDocItemCode: it.legalDocCode,
            pageClassifications: it.pageClassifications
              ? (it.pageClassifications as unknown as Prisma.JsonArray)
              : Prisma.JsonNull,
          },
        },
      },
    })),
  },
  assetContacts: {
    deleteMany: {
      NOT: {
        OR: data.contacts.map((it) => ({
          assetId: id,
          contactId: it.id,

          // Role is part of the id, so we can't simply update it.
          role: it.role,
        })),
      },
    },
    connectOrCreate: data.contacts.map(
      (it) =>
        ({
          where: {
            assetId_contactId_role: {
              assetId: id,
              contactId: it.id,
              role: it.role,
            },
          },
          create: {
            contactId: it.id,
            role: it.role,
          },
        }) satisfies Prisma.AssetContactCreateOrConnectWithoutAssetInput,
    ),
  },

  assetMain:
    data.parent == null
      ? { disconnect: true }
      : {
          connect: { assetId: data.parent },
        },

  // In the mapping of this repo,
  // `siblingYAssets` contains mappings to siblings whose `id` is greater than our own,
  // while `siblingXAssets` contains the mappings where our `id` is greater.
  // This guarantees that we have no duplicate siblings by ensuring that `x > y` for all siblings.
  siblingXAssets: {
    deleteMany: {
      assetXId: id,
      assetYId: { notIn: data.siblings },
    },
    createMany: {
      data: data.siblings
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
      assetXId: { notIn: data.siblings },
    },
    createMany: {
      data: data.siblings
        .filter((siblingId) => siblingId > id)
        .map((siblingId) => ({
          assetXId: siblingId,
        })),
      skipDuplicates: true,
    },
  },
});
