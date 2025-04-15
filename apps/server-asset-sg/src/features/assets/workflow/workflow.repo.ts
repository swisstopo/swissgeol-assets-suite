import { AssetId, Workflow, WorkflowChangeData, WorkflowStatus } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import {
  mapWorkflowStatusToPrismaWorkflowStatus,
  parseWorkflowFromPrisma,
  workflowSelection,
} from '@/features/assets/workflow/prisma-workflow';

@Injectable()
export class WorkflowRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findByAssetId(assetId: AssetId): Promise<Workflow | null> {
    const entry = await this.prisma.workflow.findUnique({
      select: workflowSelection,
      where: { assetId },
    });

    return entry == null ? null : parseWorkflowFromPrisma(entry);
  }

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
        status: mapWorkflowStatusToPrismaWorkflowStatus(data.toStatus),
        assignee: { connect: { id: assigneeId } },
        workflowChanges: {
          create: {
            comment: data.comment,
            fromStatus: mapWorkflowStatusToPrismaWorkflowStatus(fromStatus),
            toStatus: mapWorkflowStatusToPrismaWorkflowStatus(data.toStatus),
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
        status: mapWorkflowStatusToPrismaWorkflowStatus('published'),
        workflowChanges: {
          create: {
            fromStatus: mapWorkflowStatusToPrismaWorkflowStatus(fromStatus),
            toStatus: mapWorkflowStatusToPrismaWorkflowStatus('published'),
            createdBy: { connect: { id: userId } },
          },
        },
      },
      select: workflowSelection,
    });

    return parseWorkflowFromPrisma(entry);
  }
}
