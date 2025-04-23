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
      creator: { select: simpleUserSelection },
      createDate: true,
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
        creator: change.creator && parseSimpleUser(change.creator),
        fromAssignee: change.fromAssignee && parseSimpleUser(change.fromAssignee),
        toAssignee: change.toAssignee && parseSimpleUser(change.toAssignee),
        fromStatus: mapWorkflowStatusFromPrisma(change.fromStatus),
        toStatus: mapWorkflowStatusFromPrisma(change.toStatus),
      }),
    ),
    reviewedTabs: entry.reviewedTabs,
    publishedTabs: entry.publishedTabs,
    creator: entry.asset.creator && parseSimpleUser(entry.asset.creator),
    createdAt: LocalDate.fromDate(entry.asset.createDate),
    workgroupId: entry.asset.workgroupId,
  };
};
