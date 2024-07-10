import { Prisma } from '@prisma/client';
import {
  Asset,
  AssetInfo,
  AssetUsage,
  ContactAssignmentRole,
  LinkedAsset,
  AssetStudy,
  AssetStudyId,
  UsageStatusCode,
} from '@shared/models/asset';
import { LocalDate } from '@shared/models/base/local-date';

import { StudyType } from '@shared/models/study';
import { satisfy } from '@/utils/define';

type SelectedAssetInfo = Prisma.AssetGetPayload<{ select: typeof assetInfoSelection }>;
type SelectedAsset = Prisma.AssetGetPayload<{ select: typeof assetSelection }>;
type SelectedLinkedAsset = Prisma.AssetGetPayload<{ select: typeof linkedAssetSelection }>;
type SelectedUsage = Prisma.InternalUseGetPayload<{ select: typeof usageSelection }>;

const linkedAssetSelection = satisfy<Prisma.AssetSelect>()({
  assetId: true,
  titlePublic: true,
});

const usageSelection = satisfy<Prisma.PublicUseSelect & Prisma.InternalUseSelect>()({
  isAvailable: true,
  statusAssetUseItemCode: true,
  startAvailabilityDate: true,
});

export const assetInfoSelection = satisfy<Prisma.AssetSelect>()({
  assetId: true,
  titlePublic: true,
  titleOriginal: true,
  assetKindItemCode: true,
  assetFormatItemCode: true,
  ids: {
    select: {
      idId: true,
      id: true,
      description: true,
    },
  },
  assetLanguages: {
    select: {
      languageItemCode: true,
    },
  },
  assetContacts: {
    select: {
      contactId: true,
      role: true,
    },
  },
  manCatLabelRefs: {
    select: {
      manCatLabelItemCode: true,
    },
  },
  typeNatRels: {
    select: {
      natRelItemCode: true,
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
  assetFiles: {
    select: {
      file: {
        select: {
          fileId: true,
          fileName: true,
          fileSize: true,
        },
      },
    },
  },
  createDate: true,
  receiptDate: true,
  lastProcessedDate: true,
  workgroupId: true,
});

export const assetSelection = satisfy<Prisma.AssetSelect>()({
  ...assetInfoSelection,
  sgsId: true,
  municipality: true,
  processor: true,
  isNatRel: true,
  geolDataInfo: true,
  geolContactDataInfo: true,
  geolAuxDataInfo: true,
  publicUse: {
    select: usageSelection,
  },
  internalUse: {
    select: usageSelection,
  },
  statusWorks: {
    select: {
      statusWorkId: true,
      statusWorkItemCode: true,
      statusWorkDate: true,
    },
  },
  allStudies: {
    select: {
      studyId: true,
      geomText: true,
    },
  },
});

export const parseAssetInfoFromPrisma = (data: SelectedAssetInfo): AssetInfo => ({
  id: data.assetId,
  title: data.titlePublic,
  originalTitle: data.titleOriginal,
  kindCode: data.assetKindItemCode,
  formatCode: data.assetFormatItemCode,
  identifiers: data.ids.map((it) => ({
    id: it.idId,
    name: it.id,
    description: it.description,
  })),
  languageCodes: data.assetLanguages.map((it) => it.languageItemCode),
  contactAssignments: data.assetContacts.map((it) => ({
    contactId: it.contactId,
    role: it.role as ContactAssignmentRole,
  })),
  manCatLabelCodes: data.manCatLabelRefs.map((it) => it.manCatLabelItemCode),
  natRelCodes: data.typeNatRels.map((it) => it.natRelItemCode),
  links: {
    parent: data.assetMain == null ? null : parseLinkedAsset(data.assetMain),
    children: data.subordinateAssets.map(parseLinkedAsset),
    siblings: [
      ...data.siblingXAssets.map((it) => parseLinkedAsset(it.assetY)),
      ...data.siblingYAssets.map((it) => parseLinkedAsset(it.assetX)),
    ],
  },
  files: data.assetFiles.map((it) => ({
    id: it.file.fileId,
    size: Number(it.file.fileSize),
    name: it.file.fileName,
  })),
  createdAt: LocalDate.fromDate(data.createDate),
  receivedAt: LocalDate.fromDate(data.receiptDate),
  lastProcessedAt: data.lastProcessedDate,
});

export const parseAssetFromPrisma = (data: SelectedAsset): Asset => ({
  ...parseAssetInfoFromPrisma(data),
  sgsId: data.sgsId,
  municipality: data.municipality,
  processor: data.processor,
  isNatRel: data.isNatRel,
  infoGeol: {
    main: data.geolDataInfo,
    contact: data.geolContactDataInfo,
    auxiliary: data.geolAuxDataInfo,
  },
  usage: {
    public: parseUsage(data.publicUse),
    internal: parseUsage(data.internalUse),
  },
  statuses: data.statusWorks.map((it) => ({
    id: it.statusWorkId,
    itemCode: it.statusWorkItemCode,
    createdAt: it.statusWorkDate,
  })),
  studies: data.allStudies.map((it) => {
    const { type, id } = parseStudyId(it.studyId);
    return {
      id,
      type,
      geom: it.geomText,
    } as AssetStudy;
  }),
  workgroupId: data.workgroupId,
});

const parseLinkedAsset = (data: SelectedLinkedAsset): LinkedAsset => ({
  id: data.assetId,
  title: data.titlePublic,
});

const parseUsage = (data: SelectedUsage): AssetUsage => ({
  isAvailable: data.isAvailable,
  statusCode: data.statusAssetUseItemCode as UsageStatusCode,
  availableAt: data.startAvailabilityDate == null ? null : LocalDate.fromDate(data.startAvailabilityDate),
});

const parseStudyId = (studyId: string): { type: StudyType; id: AssetStudyId } => {
  if (!studyId.startsWith('study_')) {
    throw new Error('expected studyId to start with `study_`');
  }
  const parts = studyId.substring('study_'.length).split('_', 2);
  if (parts.length !== 2) {
    throw new Error(`invalid studyId '${studyId}'`);
  }
  const type = parts[0] as StudyType;
  const id = parseInt(parts[1]);
  if (isNaN(id)) {
    throw new Error(`studyId '${studyId}' has invalid number part`);
  }
  if (!Object.values(StudyType).includes(type)) {
    throw new Error(`studyId '${studyId}' has invalid type part`);
  }
  return { type, id };
};
