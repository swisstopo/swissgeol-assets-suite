import { User, Workflow, WorkflowChangeData, WorkflowChangeDataSchema, WorkflowPolicy } from '@asset-sg/shared/v2';
import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';

@Controller('/assets/:assetId/workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('/')
  async find(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<Workflow> {
    const record = await this.workflowService.find(assetId);
    authorize(WorkflowPolicy, user).canShow(record);
    return record;
  }

  @Post('/change')
  async change(
    @ParseBody(WorkflowChangeDataSchema) data: WorkflowChangeData,
    @Param('assetId', ParseIntPipe) assetId: number,
    @CurrentUser() user: User,
  ): Promise<Workflow> {
    const record = await this.workflowService.find(assetId);
    authorize(WorkflowPolicy, user).canUpdate(record);
    return this.workflowService.addChange(record, data, user.id);
  }

  @Post('/publish')
  async publish(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<Workflow> {
    const record = await this.workflowService.find(assetId);
    authorize(WorkflowPolicy, user).canUpdate(record);
    return this.workflowService.publish(record, user.id);
  }
}
