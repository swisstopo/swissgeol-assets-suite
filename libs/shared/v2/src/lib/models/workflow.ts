import { WorkflowStatus as WorkflowStatusFromPrisma } from '@prisma/client';
import { AssetId } from './asset';
import { LocalDate } from './base/local-date';
import { UserId } from './user';
import { WorkgroupId } from './workgroup';

// TODO Consider merging `assetId` and `workflowId` into one field - DVA 2025-04-15

export interface Workflow {
  assetId: AssetId;
  hasRequestedChanges: boolean;
  workflowChanges: WorkflowChange[];
  reviewedTabs: TabStatus;
  publishedTabs: TabStatus;
  status: WorkflowStatus;
  workgroupId: WorkgroupId;
}

export interface WorkflowChange {
  comment: string | null;
  createdAt: LocalDate;
  createdBy: UserId | null;
  assignee: UserId | null;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
}

export interface WorkflowChangeData {
  // TODO why is this an email and not a UserId  - DVA 2025-04-15
  assignee: string;
  comment: string | null;
  status: UnpublishedWorkflowStatus;
}

// TODO consider renaming this to something like `WorkflowSelection` - DVA 2025-04-15
export interface TabStatus {
  general: boolean;
  files: boolean;
  usage: boolean;
  contacts: boolean;
  references: boolean;
  geometries: boolean;
}

export enum WorkflowStatus {
  Draft = 'Draft',
  InReview = 'InReview',
  Reviewed = 'Reviewed',
  Published = 'Published',
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
