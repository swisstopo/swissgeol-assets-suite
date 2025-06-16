import {
  Asset,
  AssetData,
  AssetId,
  AssetLegacyData,
  isNotPersisted,
  isPersisted,
  LinkedAsset,
  LocalDate,
} from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';
import { CreateAssetData } from '@/features/assets/asset.model';
import { assetFileSelection, mapAssetFileFromPrisma } from '@/features/assets/files/prisma-file';

type SelectedAsset = Prisma.AssetGetPayload<{ select: typeof assetSelection }>;
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
  isExtract: true,

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
      manCatLabelItemCode,
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
    select: assetFileSelection,
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
} satisfies Prisma.AssetSelect;

export const parseAssetFromPrisma = (data: SelectedAsset): Asset => ({
  id: data.assetId,
  title: data.titlePublic,
  originalTitle: data.titleOriginal,
  isOfNationalInterest: data.isNatRel,
  isPublic: data.isPublic,
  isExtract: data.isExtract,
  legacyData: parseLegacyDataFromPrisma(data),
  formatCode: data.assetFormatItemCode,
  kindCode: data.assetKindItemCode,
  languageCodes: data.assetLanguages.map((it) => it.languageItemCode),
  nationalInterestTypeCodes: data.typeNatRels,
  topicCodes: data.manCatLabelRefs,
  identifiers: data.ids.map((it) => ({
    id: it.idId,
    name: it.id,
    description: it.description,
  })),
  files: data.assetFiles.map(mapAssetFileFromPrisma),
  contacts: data.assetContacts,
  parentId: data.assetMain === null ? null : parseLinkedAsset(data.assetMain),
  childrenIds: data.subordinateAssets.map(parseLinkedAsset),
  siblingIds: [
    ...data.siblingXAssets.map((it) => parseLinkedAsset(it.assetY)),
    ...data.siblingYAssets.map((it) => parseLinkedAsset(it.assetX)),
  ],
  workgroupId: data.workgroupId,
  creatorId: data.creatorId,
  createdAt: LocalDate.fromData(data.createDate),
  receivedAt: LocalDate.fromData(data.receiptDate),
});

const parseLegacyDataFromPrisma = (data: SelectedLegacyData): AssetLegacyData | null => {
  if (Object.values(data).every((value) => value == null)) {
    return null;
  }
  return {
    sgsId: data.sgsId,
    data: data.geolDataInfo,
    contactData: data.geolContactDataInfo,
    auxiliaryData: data.geolAuxDataInfo,
    municipality: data.municipality,
  };
};

const parseLinkedAsset = (data: SelectedLinkedAsset): LinkedAsset => ({
  id: data.assetId,
  title: data.titlePublic,
});

const mapDataToPrisma = (data: AssetData) =>
  ({
    titlePublic: data.title,
    titleOriginal: data.originalTitle,
    isNatRel: data.isNatRel,
    isPublic: data.isPublic,
    isExtract: data.isExtract,

    // Legacy Data
    ...mapLegacyDataToPrisma(data.legacyData),

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

const mapLegacyDataToPrisma = (data: AssetLegacyData | null) =>
  (data === null
    ? {}
    : {
        sgsId: data.sgsId,
        geolDataInfo: data.data,
        geolContactDataInfo: data.contactData,
        geolAuxDataInfo: data.auxiliaryData,
        municipality: data.municipality,
      }) satisfies Partial<Prisma.AssetCreateInput & Prisma.AssetUpdateInput>;

export const mapAssetDataToPrismaCreate = (data: CreateAssetData): Prisma.AssetCreateInput => ({
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
      data: data.natRelCodes.map((code) => ({
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
  assetFiles: {
    connect: data.files.map((it) => ({
      fileId: it,
    })),
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
  assetMain:
    data.parentId == null
      ? undefined
      : {
          connect: {
            assetId: data.parentId,
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
      data: data.links.siblings.map((siblingId) => ({
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
});

export const mapAssetDataToPrismaUpdate = (id: AssetId, data: AssetData): Prisma.AssetUpdateInput => ({
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
    deleteMany: {
      assetId: id,
      natRelItemCode: { notIn: data.nationalInterestTypeCodes },
    },
    createMany: {
      data: data.natRelCodes.map((code) => ({
        natRelItemCode: code,
      })),
      skipDuplicates: true,
    },
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
  assetFiles: {
    connect: data.files.map((it) => ({
      fileId: it,
    })),
    disconnect: {
      assetId: id,
      fileId: {
        notIn: data.files,
      },
    },
  },
  assetContacts: {
    deleteMany: {
      NOT: {
        OR: data.contactAssignments.map((it) => ({
          assetId: id,
          contactId: it.contactId,
        })),
      },
    },
    upsert: data.contactAssignments.map(
      (it) =>
        ({
          where: {
            assetId: id,
            contactId: it.contactId,
          },
          create: {
            contactId: it.contactId,
            role: it.role,
          },
          update: {
            role: it.role,
          },
        }) satisfies Prisma.AssetContactUpsertWithWhereUniqueWithoutAssetInput,
    ),
  },

  assetMain:
    data.links.parent == null
      ? { disconnect: true }
      : {
          connect: { assetId: data.links.parent },
        },

  // In the mapping of this repo,
  // `siblingYAssets` contains mappings to siblings whose `id` is greater than our own,
  // while `siblingXAssets` contains the mappings where our `id` is greater.
  // This guarantees that we have no duplicate siblings by ensuring that `x > y` for all siblings.
  siblingXAssets: {
    deleteMany: {
      assetXId: id,
      assetYId: { notIn: data.siblingIds },
    },
    createMany: {
      data: data.siblingIds
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
      assetXId: { notIn: data.siblingIds },
    },
    createMany: {
      data: data.siblingIds
        .filter((siblingId) => siblingId > id)
        .map((siblingId) => ({
          assetXId: siblingId,
        })),
      skipDuplicates: true,
    },
  },
});
