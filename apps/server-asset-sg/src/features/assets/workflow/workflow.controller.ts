import {
  User,
  Workflow,
  WorkflowChangeData,
  WorkflowChangeDataSchema,
  WorkflowPolicy,
  WorkflowPublishDataSchema,
  WorkflowSelection,
  WorkflowSchema,
  WorkflowSelectionSchema,
} from '@asset-sg/shared/v2';
import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { PartialWorkflowSelectionSchema } from '@/features/assets/workflow/workflow.model';

@Controller('/assets/:assetId/workflow')
@UseInterceptors(ClassSerializerInterceptor)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('/')
  @SerializeOptions({ type: WorkflowSchema, excludeExtraneousValues: true })
  async show(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<Workflow> {
    const record = await this.workflowService.find(assetId);
    authorize(WorkflowPolicy, user).canShow(record);
    return record;
  }

  @Patch('/review')
  @SerializeOptions({ type: WorkflowSelectionSchema, excludeExtraneousValues: true })
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
  @SerializeOptions({ type: WorkflowSelectionSchema, excludeExtraneousValues: true })
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
  @SerializeOptions({ type: WorkflowSchema, excludeExtraneousValues: true })
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
    return await this.workflowService.addChange(record, data, user.id);
  }

  @Post('/publish')
  @SerializeOptions({ type: WorkflowSchema, excludeExtraneousValues: true })
  async publish(
    @ParseBody(WorkflowPublishDataSchema) data: WorkflowPublishDataSchema,
    @Param('assetId', ParseIntPipe) assetId: number,
    @CurrentUser() user: User,
  ): Promise<Workflow> {
    const record = await this.workflowService.find(assetId);
    authorize(WorkflowPolicy, user).canUpdate(record);
    return await this.workflowService.publish(record, user.id, data);
  }
}
