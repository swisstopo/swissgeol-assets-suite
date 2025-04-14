import { LocalDate, Workflow, WorkflowStatus } from '@asset-sg/shared/v2';
import { $Enums, Prisma } from '@prisma/client';
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
    hasRequestedChanges: entry.hasRequestedChanges,
    status: mapPrismaWorkflowStatusToWorkflowStatus(entry.status),
    workflowChanges: entry.workflowChanges.map((change) => {
      return {
        comment: change.comment,
        createdAt: LocalDate.fromDate(change.createdAt),
        createdBy: change.createdBy?.email ?? null,
        assignee: change.assignee?.email ?? null,
        fromStatus: mapPrismaWorkflowStatusToWorkflowStatus(change.fromStatus),
        toStatus: mapPrismaWorkflowStatusToWorkflowStatus(change.toStatus),
      };
    }),
    reviewedTabs: {
      ...entry.reviewedTabs,
    },
    publishedTabs: {
      ...entry.publishedTabs,
    },
  };
};

const mapPrismaWorkflowStatusToWorkflowStatus = (prismaWorkflowStatus: $Enums.WorkflowStatus): WorkflowStatus => {
  switch (prismaWorkflowStatus) {
    case $Enums.WorkflowStatus.Draft:
      return 'draft';
    case $Enums.WorkflowStatus.InReview:
      return 'inReview';
    case $Enums.WorkflowStatus.Reviewed:
      return 'reviewed';
    case $Enums.WorkflowStatus.Published:
      return 'published';
  }
};

export const mapWorkflowStatusToPrismaWorkflowStatus = (workflowStatus: WorkflowStatus): $Enums.WorkflowStatus => {
  switch (workflowStatus) {
    case 'draft':
      return $Enums.WorkflowStatus.Draft;
    case 'inReview':
      return $Enums.WorkflowStatus.InReview;
    case 'reviewed':
      return $Enums.WorkflowStatus.Reviewed;
    case 'published':
      return $Enums.WorkflowStatus.Published;
  }
};
