import { AssetId, UserId, Workflow, WorkflowChangeData, WorkflowSelection, WorkflowStatus } from '@asset-sg/shared/v2';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { WorkflowRepo } from '@/features/assets/workflow/workflow.repo';

@Injectable()
export class WorkflowService {
  constructor(private readonly workflowRepo: WorkflowRepo) {}

  async find(assetId: AssetId): Promise<Workflow> {
    return handleMissing(await this.workflowRepo.find(assetId));
  }

  async addChange(workflow: Workflow, change: WorkflowChangeData, creatorId: UserId): Promise<Workflow> {
    if (workflow.status === change.status && workflow.assignee?.id === change.assigneeId) {
      throw new HttpException(
        "A change must update either the workflow's status or assignee.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return this.workflowRepo.change(workflow.id, {
      creatorId,
      comment: change.comment,
      from: { status: workflow.status, assigneeId: workflow.assignee?.id ?? null },
      to: { status: change.status, assigneeId: change.assigneeId },
    });
  }

  async updateReview(workflow: Workflow, review: Partial<WorkflowSelection>): Promise<WorkflowSelection> {
    if (workflow.status !== WorkflowStatus.InReview) {
      throw new HttpException("Review can only be changed for workflows with 'InReview' status.", HttpStatus.CONFLICT);
    }
    return handleMissing(await this.workflowRepo.reviews.update(workflow.id, review));
  }

  async publish(workflow: Workflow, creatorId: UserId) {
    if (workflow.status !== WorkflowStatus.Reviewed) {
      throw new HttpException('Cannot publish workflow in current status', HttpStatus.BAD_REQUEST);
    }
    return this.workflowRepo.change(workflow.id, {
      creatorId: creatorId,
      comment: null,
      from: { status: workflow.status, assigneeId: workflow.assignee?.id ?? null },
      to: { status: WorkflowStatus.Published, assigneeId: workflow.assignee?.id ?? null },
    });
  }
}

const handleMissing = <T>(value: T | null): T => {
  if (value === null) {
    throw new HttpException('not found', HttpStatus.NOT_FOUND);
  }
  return value;
};
