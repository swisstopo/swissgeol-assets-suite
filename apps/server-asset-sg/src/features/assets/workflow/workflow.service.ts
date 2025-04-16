import { AssetId, UserId, Workflow, WorkflowChangeData, WorkflowStatus } from '@asset-sg/shared/v2';
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

  async addChange(workflow: Workflow, data: WorkflowChangeData, createdById: UserId): Promise<Workflow> {
    this.validateStatusChange(workflow.status, data.status);

    const assignee = handleMissing(await this.userRepo.findByEmail(data.assignee));
    const createdBy = handleMissing(await this.userRepo.find(createdById));

    return this.workflowRepo.addChange(workflow.assetId, workflow.status, createdBy.id, assignee.id, data);
  }

  async publish(workflow: Workflow, userId: string) {
    if (workflow.status !== WorkflowStatus.Reviewed) {
      throw new HttpException('Cannot publish workflow in current status', HttpStatus.BAD_REQUEST);
    }
    const publisher = handleMissing(await this.userRepo.find(userId));
    return this.workflowRepo.publish(workflow.assetId, publisher.id, workflow.status);
  }

  private validateStatusChange(fromStatus: WorkflowStatus, toStatus: WorkflowStatus): void {
    if (toStatus === WorkflowStatus.Published) {
      throw new HttpException('Cannot change status to published directly', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (fromStatus === toStatus) {
      throw new HttpException('No status change', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}

const handleMissing = <T>(value: T | null): T => {
  if (value === null) {
    throw new HttpException('not found', HttpStatus.NOT_FOUND);
  }
  return value;
};
