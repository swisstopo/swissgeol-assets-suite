import {
  WorkflowSelection as WorkflowSelectionFromPrisma,
  WorkflowStatus as WorkflowStatusFromPrisma,
} from '@prisma/client';
import { GenericWorkflow, WorkflowChange, WorkflowStatus } from '@swissgeol/ui-core';
import { isDeepEqual } from '../utils/is-deep-equal';
import { Asset, AssetId } from './asset';
import { AssetContactRole } from './contact';
import { UserId } from './user';
import { WorkgroupId } from './workgroup';

export { WorkflowChange, WorkflowStatus };

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

export type WorkflowPublishData = Pick<WorkflowChangeData, 'comment'>;

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

type AssetField = keyof Asset;

type AssetGetter = (record: Asset) => unknown;

/**
 * Defines the fields that belong to each specific selection category.
 */
const selectionCategoryMapping = {
  [WorkflowSelectionCategory.General]: [
    'workgroupId',
    'title',
    'originalTitle',
    'createdAt',
    'receivedAt',
    'kindCode',
    'formatCode',
    'languageCodes',
    'isOfNationalInterest',
    'nationalInterestTypeCodes',
    'topicCodes',
    'identifiers',
  ],
  [WorkflowSelectionCategory.NormalFiles]: [(asset) => asset.files.filter((it) => it.legalDocCode === null)],
  [WorkflowSelectionCategory.LegalFiles]: [(asset) => asset.files.filter((it) => it.legalDocCode !== null)],
  [WorkflowSelectionCategory.Authors]: [(asset) => asset.contacts.filter((it) => it.role === AssetContactRole.Author)],
  [WorkflowSelectionCategory.Initiators]: [
    (asset) => asset.contacts.filter((it) => it.role === AssetContactRole.Initiator),
  ],
  [WorkflowSelectionCategory.Suppliers]: [
    (asset) => asset.contacts.filter((it) => it.role === AssetContactRole.Supplier),
  ],
  [WorkflowSelectionCategory.References]: ['parent', (asset) => asset.siblings.map((it) => it.id)],
} satisfies Record<
  Exclude<WorkflowSelectionCategory, WorkflowSelectionCategory.Geometries | WorkflowSelectionCategory.Legacy>,
  Array<AssetField | AssetGetter>
>;

/**
 * Compares all fields of a category for two assets, determining whether that category has changes made to it.
 *
 * @param original The original asset.
 * @param update The changed asset.
 * @param category The category of fields to compare.
 */
export const hasWorkflowSelectionChanged = (
  original: Asset,
  update: Asset,
  category: WorkflowSelectionCategory,
): boolean => {
  if (category === WorkflowSelectionCategory.Legacy) {
    // Legacy data can't be changed.
    return false;
  }
  if (category === WorkflowSelectionCategory.Geometries) {
    // Geometry changes have to be tracked outside of this function.
    throw new Error("Changes to a workflow's geometries have to be tracked separately.");
  }
  const mapping = selectionCategoryMapping[category];
  for (const entry of mapping) {
    const get = makeAssetGetter(entry);
    if (!isDeepEqual(get(original), get(update))) {
      return true;
    }
  }
  return false;
};

const makeAssetGetter = (entry: AssetField | AssetGetter): AssetGetter => {
  return typeof entry === 'string' ? (asset) => asset[entry] : entry;
};
