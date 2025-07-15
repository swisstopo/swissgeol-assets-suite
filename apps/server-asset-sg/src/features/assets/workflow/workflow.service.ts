import {
  Asset,
  AssetId,
  GeometryData,
  hasWorkflowSelectionChanged,
  UserId,
  Workflow,
  WorkflowChangeData,
  WorkflowPolicy,
  WorkflowPublishDataSchema,
  WorkflowSelection,
  WorkflowSelectionCategory,
  WorkflowStatus,
} from '@asset-sg/shared/v2';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { WorkflowRepo } from '@/features/assets/workflow/workflow.repo';
import { UserRepo } from '@/features/users/user.repo';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly workflowRepo: WorkflowRepo,
    private readonly userRepo: UserRepo,
  ) {}

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
    if (change.assigneeId) {
      const newAssignee = await this.userRepo.find(change.assigneeId);
      if (!newAssignee) {
        throw new HttpException(`Assignee with ID ${change.assigneeId} not found.`, HttpStatus.UNPROCESSABLE_ENTITY);
      }
      const policy = new WorkflowPolicy(newAssignee);
      if (!policy.canUpdate({ ...workflow, status: change.status })) {
        throw new HttpException(
          "The selected assignee's role is not sufficient for the new status.",
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    return this.workflowRepo.change(workflow.id, {
      creatorId,
      comment: change.comment,
      hasRequestedChanges: change.hasRequestedChanges,
      from: { status: workflow.status, assigneeId: (workflow.assignee?.id ?? null) as string | null },
      to: { status: change.status, assigneeId: change.assigneeId },
    });
  }

  async updateReview(workflow: Workflow, review: Partial<WorkflowSelection>): Promise<WorkflowSelection> {
    if (workflow.status !== WorkflowStatus.InReview) {
      throw new HttpException("Review can only be changed for workflows with 'InReview' status.", HttpStatus.CONFLICT);
    }
    return handleMissing(await this.workflowRepo.reviews.update(workflow.id, review));
  }

  async updateApproval(workflow: Workflow, approval: Partial<WorkflowSelection>): Promise<WorkflowSelection> {
    if (workflow.status !== WorkflowStatus.Reviewed) {
      throw new HttpException(
        "Approval can only be changed for workflows with 'Reviewed' status.",
        HttpStatus.CONFLICT,
      );
    }
    return handleMissing(await this.workflowRepo.approvals.update(workflow.id, approval));
  }

  async publish(workflow: Workflow, creatorId: UserId, data: WorkflowPublishDataSchema) {
    if (workflow.status !== WorkflowStatus.Reviewed) {
      throw new HttpException('Cannot publish workflow in current status', HttpStatus.BAD_REQUEST);
    }
    return this.workflowRepo.change(workflow.id, {
      creatorId: creatorId,
      comment: data.comment,
      from: { status: workflow.status, assigneeId: (workflow.assignee?.id ?? null) as string | null },
      to: { status: WorkflowStatus.Published, assigneeId: (workflow.assignee?.id ?? null) as string | null },
    });
  }

  async updateSelectionByChanges(original: Asset, update: Asset, geometryData: GeometryData[]): Promise<void> {
    if (original.id !== update.id) {
      throw new Error("Can't compare changes of two separate assets.");
    }

    const changes: Partial<WorkflowSelection> = {};
    for (const category of Object.values(WorkflowSelectionCategory)) {
      if (category == WorkflowSelectionCategory.Geometries) {
        if (geometryData.length === 0) {
          continue;
        }
      } else if (!hasWorkflowSelectionChanged(original, update, category)) {
        continue;
      }
      changes[category] = false;
    }

    if (Object.keys(changes).length !== 0) {
      await Promise.all([
        this.workflowRepo.approvals.update(original.id, changes),
        this.workflowRepo.reviews.update(original.id, changes),
      ]);
    }
  }
}

const handleMissing = <T>(value: T | null): T => {
  if (value === null) {
    throw new HttpException('not found', HttpStatus.NOT_FOUND);
  }
  return value;
};
