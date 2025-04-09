import { User, UserId, Workflow, WorkflowChangeData, WorkflowStatus } from '@asset-sg/shared/v2';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { WorkflowRepo } from '@/features/assets/workflow/workflow.repo';
import { UserRepo } from '@/features/users/user.repo';

// TODO assets-493: Add authorization checks
@Injectable()
export class WorkflowService {
  constructor(
    private readonly workflowRepo: WorkflowRepo,
    private readonly assetUserRepo: UserRepo,
    private readonly prismaService: PrismaService
  ) {}

  async findByAssetId(assetId: number): Promise<Workflow> {
    return this.getRecordOrThrow(assetId);
  }

  async addChange(assetId: number, data: WorkflowChangeData, createdById: UserId): Promise<Workflow> {
    if (data.toStatus === 'published') {
      throw new HttpException('Cannot change status to published directly', HttpStatus.BAD_REQUEST);
    }

    return this.prismaService.$transaction(async () => {
      const record = await this.getRecordOrThrow(assetId);
      this.validateStatusChange(record.status, data.toStatus);

      const assignee = await this.assetUserRepo.findByEmail(data.assignee);
      if (assignee == null) {
        throw new HttpException('Assignee not found', HttpStatus.NOT_FOUND);
      }
      const createdBy = await this.getUserOrThrow(createdById);

      return this.workflowRepo.addChange(assetId, record.status, createdBy.id, assignee.id, data);
    });
  }

  async publish(assetId: number, userId: string) {
    return this.prismaService.$transaction(async () => {
      const record = await this.getRecordOrThrow(assetId);
      const publisher = await this.getUserOrThrow(userId);

      if (record.status !== 'reviewed') {
        throw new HttpException('Cannot publish workflow in current status', HttpStatus.BAD_REQUEST);
      }

      return this.workflowRepo.publish(assetId, publisher.id, record.status);
    });
  }

  private async getRecordOrThrow(assetId: number): Promise<Workflow> {
    const record = await this.workflowRepo.findByAssetId(assetId);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    return record;
  }

  private async getUserOrThrow(userId: UserId): Promise<User> {
    const user = await this.assetUserRepo.find(userId);
    if (user == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  private validateStatusChange(fromStatus: WorkflowStatus, toStatus: WorkflowStatus): void {
    if (fromStatus === toStatus) {
      throw new HttpException('No status change', HttpStatus.BAD_REQUEST);
    }

    if (fromStatus === 'draft' && toStatus === 'reviewed') {
      throw new HttpException('Cannot change status from draft to reviewed directly', HttpStatus.BAD_REQUEST);
    }
  }
}
