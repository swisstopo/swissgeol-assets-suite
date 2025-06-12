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
