import {
  User,
  Workflow,
  WorkflowChangeData,
  WorkflowChangeDataSchema,
  WorkflowPolicy,
  WorkflowSelection,
} from '@asset-sg/shared/v2';
import { Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { PartialWorkflowSelectionSchema } from '@/features/assets/workflow/workflow.model';

@Controller('/assets/:assetId/workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('/')
  async show(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<Workflow> {
    const record = await this.workflowService.find(assetId);
    authorize(WorkflowPolicy, user).canShow(record);
    return record;
  }

  @Patch('/review')
  async updateReview(
    @ParseBody(PartialWorkflowSelectionSchema) data: Partial<PartialWorkflowSelectionSchema>,
    @Param('assetId', ParseIntPipe) assetId: number,
    @CurrentUser() user: User,
  ): Promise<WorkflowSelection> {
    const record = await this.workflowService.find(assetId);
    authorize(WorkflowPolicy, user).canUpdate(record);
    return this.workflowService.updateReview(record, data);
  }

  @Patch('/approval')
  async updateApproval(
    @ParseBody(PartialWorkflowSelectionSchema) data: Partial<PartialWorkflowSelectionSchema>,
    @Param('assetId', ParseIntPipe) assetId: number,
    @CurrentUser() user: User,
  ): Promise<WorkflowSelection> {
    const record = await this.workflowService.find(assetId);
    authorize(WorkflowPolicy, user).canUpdate(record);
    return this.workflowService.updateApproval(record, data);
  }

  @Post('/change')
  async createChange(
    @ParseBody(WorkflowChangeDataSchema) data: WorkflowChangeData,
    @Param('assetId', ParseIntPipe) assetId: number,
    @CurrentUser() user: User,
  ): Promise<Workflow> {
    const record = await this.workflowService.find(assetId);
    if (data.status !== record.status) {
      authorize(WorkflowPolicy, user).canChangeStatus(record);
    } else {
      authorize(WorkflowPolicy, user).canChangeAssignee(record);
    }
    return this.workflowService.addChange(record, data, user.id);
  }

  @Post('/publish')
  async publish(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<Workflow> {
    const record = await this.workflowService.find(assetId);
    authorize(WorkflowPolicy, user).canUpdate(record);
    return this.workflowService.publish(record, user.id);
  }
}
