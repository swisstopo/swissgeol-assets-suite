import { AssetId, WorkflowSelection } from '@asset-sg/shared/v2';
import { PrismaService } from '@/core/prisma.service';
import { UpdateRepo } from '@/core/repo';
import {
  parseWorkflowSelectionFromPrisma,
  workflowSelectionSelection,
} from '@/features/assets/workflow/prisma-workflow';

export class WorkflowSelectionRepo implements UpdateRepo<WorkflowSelection, AssetId, Partial<WorkflowSelection>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly field: 'reviewWorkflow' | 'approvalWorkflow',
  ) {}

  async update(id: AssetId, data: Partial<WorkflowSelection>): Promise<WorkflowSelection | null> {
    const entry = await this.prisma.workflowSelection.updateManyAndReturn({
      where: {
        [this.field]: { id },
      },
      data,
      select: workflowSelectionSelection,
      limit: 1,
    });
    return entry.length === 0 ? null : parseWorkflowSelectionFromPrisma(entry[0]);
  }
}
