import { LocalDate, mapWorkflowStatusFromPrisma, Workflow, WorkflowChange } from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';
import { parseSimpleUser, simpleUserSelection } from '@/features/users/user.repo';
import { satisfy } from '@/utils/define';

type SelectedWorkflow = Prisma.WorkflowGetPayload<{ select: typeof workflowSelection }>;

const tabStatusSelection = satisfy<Prisma.TabStatusSelect>()({
  files: true,
  usage: true,
  general: true,
  geometries: true,
  references: true,
  contacts: true,
});

export const workflowSelection = satisfy<Prisma.WorkflowSelect>()({
  assetId: true,
  asset: {
    select: {
      workgroupId: true,
    },
  },
  hasRequestedChanges: true,
  assignee: { select: simpleUserSelection },
  status: true,
  publishedTabs: {
    select: tabStatusSelection,
  },
  reviewedTabs: {
    select: tabStatusSelection,
  },
  workflowChanges: {
    select: {
      assignee: { select: simpleUserSelection },
      createdBy: { select: simpleUserSelection },
      createdAt: true,
      fromStatus: true,
      toStatus: true,
      comment: true,
    },
  },
});

export const parseWorkflowFromPrisma = (entry: SelectedWorkflow): Workflow => {
  return {
    assetId: entry.assetId,
    hasRequestedChanges: entry.hasRequestedChanges,
    status: mapWorkflowStatusFromPrisma(entry.status),
    assignee: entry.assignee && parseSimpleUser(entry.assignee),
    workflowChanges: entry.workflowChanges.map(
      (change): WorkflowChange => ({
        comment: change.comment,
        createdAt: LocalDate.fromDate(change.createdAt),
        initiator: change.createdBy && parseSimpleUser(change.createdBy),
        assignee: change.assignee && parseSimpleUser(change.assignee),
        fromStatus: mapWorkflowStatusFromPrisma(change.fromStatus),
        toStatus: mapWorkflowStatusFromPrisma(change.toStatus),
      }),
    ),
    reviewedTabs: entry.reviewedTabs,
    publishedTabs: entry.publishedTabs,
    workgroupId: entry.asset.workgroupId,
  };
};
