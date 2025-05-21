import { AssetId, UserId, Workflow, WorkflowStatus } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { FindRepo } from '@/core/repo';
import { parseWorkflowFromPrisma, workflowSelection } from '@/features/assets/workflow/prisma-workflow';
import { WorkflowSelectionRepo } from '@/features/assets/workflow/workflow-selection.repo';

@Injectable()
export class WorkflowRepo implements FindRepo<Workflow, AssetId> {
  constructor(private readonly prisma: PrismaService) {}

  get reviews(): WorkflowSelectionRepo {
    return new WorkflowSelectionRepo(this.prisma, 'reviewWorkflow');
  }

  get approvals(): WorkflowSelectionRepo {
    return new WorkflowSelectionRepo(this.prisma, 'approvalWorkflow');
  }

  async find(id: AssetId): Promise<Workflow | null> {
    const entry = await this.prisma.workflow.findUnique({
      select: workflowSelection,
      where: { id },
    });

    return entry == null ? null : parseWorkflowFromPrisma(entry);
  }

  async change(id: AssetId, { creatorId, comment, from, to }: ChangeOptions): Promise<Workflow> {
    const entry = await this.prisma.workflow.update({
      where: { id },
      data: {
        status: to.status ?? undefined,
        assignee: to.assigneeId === null ? { disconnect: true } : { connect: { id: to.assigneeId } },
        changes: {
          create: {
            comment,
            fromStatus: from.status,
            toStatus: to.status,
            fromAssignee: from.assigneeId === null ? undefined : { connect: { id: from.assigneeId } },
            toAssignee: to.assigneeId === null ? undefined : { connect: { id: to.assigneeId } },
            creator: { connect: { id: creatorId } },
          },
        },
      },
      select: workflowSelection,
    });
    return parseWorkflowFromPrisma(entry);
  }
}

interface ChangeOptions {
  creatorId: UserId;
  comment: string | null;
  from: { status: WorkflowStatus; assigneeId: UserId | null };
  to: { status: WorkflowStatus; assigneeId: UserId | null };
}
