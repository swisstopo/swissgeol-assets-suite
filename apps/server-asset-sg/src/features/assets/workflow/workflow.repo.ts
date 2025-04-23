import { AssetId, Workflow, WorkflowChangeData, WorkflowStatus } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { FindRepo } from '@/core/repo';
import { parseWorkflowFromPrisma, workflowSelection } from '@/features/assets/workflow/prisma-workflow';

@Injectable()
export class WorkflowRepo implements FindRepo<Workflow, AssetId> {
  constructor(private readonly prisma: PrismaService) {}

  async find(assetId: AssetId): Promise<Workflow | null> {
    const entry = await this.prisma.workflow.findUnique({
      select: workflowSelection,
      where: { assetId },
    });

    return entry == null ? null : parseWorkflowFromPrisma(entry);
  }

  // TODO If `WorkflowChangeData.assignee` was a UserId, we could merge most of these parameters - DVA 2025-04-15
  async addChange(
    assetId: AssetId,
    fromStatus: WorkflowStatus,
    createdById: string,
    assigneeId: string,
    data: WorkflowChangeData,
  ): Promise<Workflow> {
    const entry = await this.prisma.workflow.update({
      where: { assetId },
      data: {
        status: data.status,
        assignee: { connect: { id: assigneeId } },
        workflowChanges: {
          create: {
            comment: data.comment,
            fromStatus: fromStatus,
            toStatus: data.status,
            createdBy: { connect: { id: createdById } },
            assignee: { connect: { id: assigneeId } },
          },
        },
      },
      select: workflowSelection,
    });

    return parseWorkflowFromPrisma(entry);
  }

  async publish(assetId: AssetId, userId: string, fromStatus: WorkflowStatus): Promise<Workflow> {
    const entry = await this.prisma.workflow.update({
      where: { assetId },
      data: {
        assignee: { connect: { id: userId } },
        status: WorkflowStatus.Published,
        workflowChanges: {
          create: {
            fromStatus,
            toStatus: WorkflowStatus.Published,
            createdBy: { connect: { id: userId } },
          },
        },
      },
      select: workflowSelection,
    });

    return parseWorkflowFromPrisma(entry);
  }
}
