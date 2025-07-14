import {
  LocalDate,
  mapWorkflowStatusFromPrisma,
  Workflow,
  WorkflowChange,
  WorkflowSelection,
} from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';
import { parseSimpleUser, simpleUserSelection } from '@/features/users/user.repo';
import { satisfy } from '@/utils/define';

type SelectedWorkflow = Prisma.WorkflowGetPayload<{ select: typeof workflowSelection }>;

export const workflowSelectionSelection = satisfy<Prisma.WorkflowSelectionSelect>()({
  general: true,
  normalFiles: true,
  legalFiles: true,
  authors: true,
  initiators: true,
  suppliers: true,
  references: true,
  geometries: true,
  legacy: true,
});

export const workflowSelection = satisfy<Prisma.WorkflowSelect>()({
  id: true,
  asset: {
    select: {
      workgroupId: true,
      creator: { select: simpleUserSelection },
      createdAt: true,
    },
  },
  hasRequestedChanges: true,
  assignee: { select: simpleUserSelection },
  status: true,
  review: {
    select: workflowSelectionSelection,
  },
  approval: {
    select: workflowSelectionSelection,
  },
  changes: {
    select: {
      fromAssignee: { select: simpleUserSelection },
      toAssignee: { select: simpleUserSelection },
      creator: { select: simpleUserSelection },
      createdAt: true,
      fromStatus: true,
      toStatus: true,
      comment: true,
    },
  },
});

export const parseWorkflowFromPrisma = (entry: SelectedWorkflow): Workflow => ({
  id: entry.id,
  hasRequestedChanges: entry.hasRequestedChanges,
  status: mapWorkflowStatusFromPrisma(entry.status),
  assignee: entry.assignee && parseSimpleUser(entry.assignee, entry.asset.workgroupId),
  changes: entry.changes.map(
    (change): WorkflowChange => ({
      comment: change.comment,
      createdAt: LocalDate.fromDate(change.createdAt),
      creator: change.creator && parseSimpleUser(change.creator, entry.asset.workgroupId),
      fromAssignee: change.fromAssignee && parseSimpleUser(change.fromAssignee, entry.asset.workgroupId),
      toAssignee: change.toAssignee && parseSimpleUser(change.toAssignee, entry.asset.workgroupId),
      fromStatus: mapWorkflowStatusFromPrisma(change.fromStatus),
      toStatus: mapWorkflowStatusFromPrisma(change.toStatus),
    }),
  ),
  review: parseWorkflowSelectionFromPrisma(entry.review),
  approval: parseWorkflowSelectionFromPrisma(entry.approval),
  creator: entry.asset.creator && parseSimpleUser(entry.asset.creator, entry.asset.workgroupId),
  createdAt: LocalDate.fromDate(entry.asset.createdAt),
  workgroupId: entry.asset.workgroupId,
});

export const parseWorkflowSelectionFromPrisma = (entry: SelectedWorkflow['review']): WorkflowSelection => ({
  general: entry.general,
  normalFiles: entry.normalFiles,
  legalFiles: entry.legalFiles,
  authors: entry.authors,
  initiators: entry.initiators,
  suppliers: entry.suppliers,
  references: entry.references,
  geometries: entry.geometries,
  legacy: entry.legacy,
});
