import { LocalDate } from './base/local-date';
import { UserId } from './user';

export const WorkflowStatusValues = ['draft', 'inReview', 'reviewed', 'published'] as const;
export type WorkflowStatus = (typeof WorkflowStatusValues)[number];

export interface WorkflowChange {
  comment: string | null;
  createdAt: LocalDate;
  createdBy: UserId | null;
  assignee: UserId | null;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
}

export interface WorkflowChangeData extends Omit<WorkflowChange, 'createdAt' | 'fromStatus' | 'createdBy'> {
  assignee: string;
}

export interface TabStatus {
  general: boolean;
  files: boolean;
  usage: boolean;
  contacts: boolean;
  references: boolean;
  geometries: boolean;
}

export interface Workflow {
  hasRequestedChanges: boolean;
  workflowChanges: WorkflowChange[];
  reviewedTabs: TabStatus;
  publishedTabs: TabStatus;
  status: WorkflowStatus;
}
