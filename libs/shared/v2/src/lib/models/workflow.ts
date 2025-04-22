import {
  WorkflowSelection as WorkflowSelectionFromPrisma,
  WorkflowStatus as WorkflowStatusFromPrisma,
} from '@prisma/client';
import { AssetId } from './asset';
import { LocalDate } from './base/local-date';
import { SimpleUser, UserId } from './user';
import { WorkgroupId } from './workgroup';

export interface Workflow {
  id: AssetId;
  hasRequestedChanges: boolean;
  changes: WorkflowChange[];
  review: WorkflowSelection;
  approval: WorkflowSelection;
  status: WorkflowStatus;
  assignee: SimpleUser | null;
  creator: SimpleUser | null;
  createdAt: LocalDate;
  workgroupId: WorkgroupId;
}

export type WorkflowSelection = Omit<WorkflowSelectionFromPrisma, 'id'>;

export interface WorkflowChange {
  comment: string | null;
  creator: SimpleUser | null;
  fromAssignee: SimpleUser | null;
  toAssignee: SimpleUser | null;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
  createdAt: LocalDate;
}

export interface WorkflowChangeData {
  comment: string | null;
  status: UnpublishedWorkflowStatus;
  assigneeId: UserId | null;
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
