import { deepEqual } from '@asset-sg/core';
import { AssetEditDetail } from '@asset-sg/shared';
import {
  WorkflowSelection as WorkflowSelectionFromPrisma,
  WorkflowStatus as WorkflowStatusFromPrisma,
} from '@prisma/client';
import { GenericWorkflow, WorkflowChange, WorkflowStatus } from '@swisstopo/swissgeol-ui-core';
import { AssetId } from './asset';
import { UserId } from './user';
import { WorkgroupId } from './workgroup';

export { WorkflowStatus, WorkflowChange };

export interface Workflow extends GenericWorkflow {
  id: AssetId;
  review: WorkflowSelection;
  approval: WorkflowSelection;
  workgroupId: WorkgroupId;
}

export type WorkflowSelection = Omit<WorkflowSelectionFromPrisma, 'id'>;

export enum WorkflowSelectionCategory {
  General = 'general',
  NormalFiles = 'normalFiles',
  LegalFiles = 'legalFiles',
  Authors = 'authors',
  Initiators = 'initiators',
  Suppliers = 'suppliers',
  References = 'references',
  Geometries = 'geometries',
  Legacy = 'legacy',
}

export interface WorkflowChangeData {
  comment: string | null;
  status: UnpublishedWorkflowStatus;
  assigneeId: UserId | null;
  hasRequestedChanges?: boolean;
}

export const UnpublishedWorkflowStatus = [
  WorkflowStatus.Draft,
  WorkflowStatus.InReview,
  WorkflowStatus.Reviewed,
] as const;
export type UnpublishedWorkflowStatus = (typeof UnpublishedWorkflowStatus)[number];

export const mapWorkflowStatusToPrisma = (status: WorkflowStatus): WorkflowStatusFromPrisma => {
  return status as WorkflowStatusFromPrisma;
};

export const mapWorkflowStatusFromPrisma = (status: WorkflowStatusFromPrisma): WorkflowStatus => {
  return status as WorkflowStatus;
};

export const getWorkflowStatusIndex = (status: WorkflowStatus): number => {
  switch (status) {
    case WorkflowStatus.Draft:
      return 0;
    case WorkflowStatus.InReview:
      return 1;
    case WorkflowStatus.Reviewed:
      return 2;
    case WorkflowStatus.Published:
      return 3;
  }
};

type AssetField = keyof AssetEditDetail;

type AssetGetter = (record: AssetEditDetail) => unknown;

/**
 * Defines the fields that belong to each specific selection category.
 */
const selectionCategoryMapping = {
  [WorkflowSelectionCategory.General]: [
    'workgroupId',
    'titlePublic',
    'titleOriginal',
    'createDate',
    'receiptDate',
    'assetKindItemCode',
    'assetFormatItemCode',
    'assetLanguages',
    'isNatRel',
    'typeNatRels',
    'manCatLabelRefs',
    'ids',
  ],
  [WorkflowSelectionCategory.NormalFiles]: [(asset) => asset.assetFiles.filter((it) => it.type === 'Normal')],
  [WorkflowSelectionCategory.LegalFiles]: [(asset) => asset.assetFiles.filter((it) => it.type === 'Legal')],
  [WorkflowSelectionCategory.Authors]: [(asset) => asset.assetContacts.filter((it) => it.role === 'author')],
  [WorkflowSelectionCategory.Initiators]: [(asset) => asset.assetContacts.filter((it) => it.role === 'initiator')],
  [WorkflowSelectionCategory.Suppliers]: [(asset) => asset.assetContacts.filter((it) => it.role === 'supplier')],
  [WorkflowSelectionCategory.References]: [
    'assetMain',
    (asset) => [...asset.siblingXAssets.map((it) => it.assetId), ...asset.siblingYAssets.map((it) => it.assetId)],
  ],
  [WorkflowSelectionCategory.Geometries]: ['studies'],
  [WorkflowSelectionCategory.Legacy]: ['sgsId', 'geolDataInfo', 'geolContactDataInfo', 'geolAuxDataInfo'],
} satisfies Record<WorkflowSelectionCategory, Array<AssetField | AssetGetter>>;

/**
 * Compares all fields of a category for two assets, determining whether that category has changes made to it.
 *
 * @param original The original asset.
 * @param update The changed asset.
 * @param category The category of fields to compare.
 */
export const hasWorkflowSelectionChanged = (
  original: AssetEditDetail,
  update: AssetEditDetail,
  category: WorkflowSelectionCategory,
): boolean => {
  const mapping = selectionCategoryMapping[category];
  for (const entry of mapping) {
    const get = makeAssetGetter(entry);
    if (!deepEqual(get(original), get(update))) {
      return true;
    }
  }
  return false;
};

const makeAssetGetter = (entry: AssetField | AssetGetter): AssetGetter => {
  return typeof entry === 'string' ? (asset) => asset[entry] : entry;
};
