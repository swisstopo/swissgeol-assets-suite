import { LocalDate, mapWorkflowStatusFromPrisma, Workflow, WorkflowChange } from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';
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

const relatedUserSelection = satisfy<Prisma.AssetUserSelect>()({
  email: true,
});

export const workflowSelection = satisfy<Prisma.WorkflowSelect>()({
  assetId: true,
  asset: {
    select: {
      workgroupId: true,
    },
  },
  hasRequestedChanges: true,
  assignee: { select: relatedUserSelection },
  status: true,
  publishedTabs: {
    select: tabStatusSelection,
  },
  reviewedTabs: {
    select: tabStatusSelection,
  },
  workflowChanges: {
    select: {
      assignee: { select: relatedUserSelection },
      createdBy: { select: relatedUserSelection },
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
    workflowChanges: entry.workflowChanges.map(
      (change): WorkflowChange => ({
        comment: change.comment,
        createdAt: LocalDate.fromDate(change.createdAt),
        createdBy: change.createdBy?.email ?? null,
        assignee: change.assignee?.email ?? null,
        fromStatus: mapWorkflowStatusFromPrisma(change.fromStatus),
        toStatus: mapWorkflowStatusFromPrisma(change.toStatus),
      }),
    ),
    reviewedTabs: entry.reviewedTabs,
    publishedTabs: entry.publishedTabs,
    workgroupId: entry.asset.workgroupId,
  };
};
