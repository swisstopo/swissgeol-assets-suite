import {
  Asset,
  AssetId,
  GeometryData,
  hasWorkflowSelectionChanged,
  User,
  UserId,
  WorkflowChangeData,
  WorkflowPolicy,
  WorkflowPublishDataSchema,
  WorkflowSelection,
  WorkflowSelectionCategory,
  WorkflowStatus,
  WorkflowWithAsset,
} from '@asset-sg/shared/v2';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AssetSearchService } from '../search/asset-search.service';
import { WorkflowRepo } from '@/features/assets/workflow/workflow.repo';
import { UserRepo } from '@/features/users/user.repo';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly workflowRepo: WorkflowRepo,
    private readonly userRepo: UserRepo,
    private readonly assetSearchService: AssetSearchService,
  ) {}

  async find(assetId: AssetId): Promise<WorkflowWithAsset> {
    return handleMissing(await this.workflowRepo.find(assetId));
  }

  async addChange(
    workflow: WorkflowWithAsset,
    change: WorkflowChangeData,
    creatorId: UserId,
  ): Promise<WorkflowWithAsset> {
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

    const updatedWorkflow = await this.workflowRepo.change(workflow.id, {
      creatorId,
      comment: change.comment,
      hasRequestedChanges: change.hasRequestedChanges,
      from: { status: workflow.status, assigneeId: (workflow.assignee?.id ?? null) as string | null },
      to: { status: change.status, assigneeId: change.assigneeId },
    });

    await this.registerAssetForChange(updatedWorkflow.asset);

    return updatedWorkflow;
  }

  async updateReview(workflow: WorkflowWithAsset, review: Partial<WorkflowSelection>): Promise<WorkflowSelection> {
    if (workflow.status !== WorkflowStatus.InReview) {
      throw new HttpException("Review can only be changed for workflows with 'InReview' status.", HttpStatus.CONFLICT);
    }
    const reviews = handleMissing(await this.workflowRepo.reviews.update(workflow.id, review));
    const updatedApproval: Partial<WorkflowSelection> = Object.fromEntries(
      Object.entries(review).map(([key, value]) => {
        if (typeof value === 'boolean') {
          return [key, false];
        }
        return [key, value];
      }),
    );
    handleMissing(await this.workflowRepo.approvals.update(workflow.id, updatedApproval));
    return reviews;
  }

  async updateApproval(workflow: WorkflowWithAsset, approval: Partial<WorkflowSelection>): Promise<WorkflowSelection> {
    if (workflow.status !== WorkflowStatus.Reviewed) {
      throw new HttpException(
        "Approval can only be changed for workflows with 'Reviewed' status.",
        HttpStatus.CONFLICT,
      );
    }
    return handleMissing(await this.workflowRepo.approvals.update(workflow.id, approval));
  }

  async publish(
    workflow: WorkflowWithAsset,
    creatorId: UserId,
    data: WorkflowPublishDataSchema,
  ): Promise<WorkflowWithAsset> {
    if (workflow.status !== WorkflowStatus.Reviewed) {
      throw new HttpException('Cannot publish workflow in current status', HttpStatus.BAD_REQUEST);
    }
    const updatedWorkflow = await this.workflowRepo.change(workflow.id, {
      creatorId: creatorId,
      comment: data.comment,
      from: { status: workflow.status, assigneeId: (workflow.assignee?.id ?? null) as string | null },
      to: { status: WorkflowStatus.Published, assigneeId: (workflow.assignee?.id ?? null) as string | null },
    });

    await this.registerAssetForChange(updatedWorkflow.asset);

    return updatedWorkflow;
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

  public async handleWorkflowForUpdatedAsset(asset: Asset, user: User) {
    if (asset.workflowStatus !== WorkflowStatus.Draft) {
      const workflow = await this.workflowRepo.find(asset.id);
      if (workflow === null) {
        throw new HttpException('not found', HttpStatus.NOT_FOUND);
      }

      const change: WorkflowChangeData = {
        status: WorkflowStatus.Draft,
        assigneeId: user.id,
        comment: "Asset was edited. Resetting workflow to 'Draft'.",
      };

      await this.addChange(workflow, change, user.id);
    } else {
      await this.registerAssetForChange(asset);
    }
  }

  /**
   * Registers the asset for update in the search index, so that any changes to the workflow will be reflected in the
   * search results. Note that in theory, this might result in a race condition, where a user submits asset changes and
   * immediately sends workflow changes; in which case, the asset fetched here might not be updated yet and override
   * the previously synced asset with the older state. However, this case seems very unlikely and if this happens, the
   * approach would require changes to how assets are registered, i.e. submitting the assetid only and fetching the
   * latest asset in AssetSeachService.register().
   */
  private async registerAssetForChange(asset: Asset) {
    await this.assetSearchService.register(asset);
  }
}

const handleMissing = <T>(value: T | null): T => {
  if (value === null) {
    throw new HttpException('not found', HttpStatus.NOT_FOUND);
  }
  return value;
};
