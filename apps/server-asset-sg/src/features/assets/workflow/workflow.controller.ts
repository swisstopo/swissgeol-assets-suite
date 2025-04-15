import { User, Workflow, WorkflowChangeData, WorkflowChangeDataSchema } from '@asset-sg/shared/v2';
import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';

// TODO assets-493: Add authorization checks
@Controller('/assets/:assetId/workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('/')
  async find(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<Workflow> {
    return this.workflowService.findByAssetId(assetId);
  }

  @Post('/change')
  async change(
    @ParseBody(WorkflowChangeDataSchema) data: WorkflowChangeData,
    @Param('assetId', ParseIntPipe) assetId: number,
    @CurrentUser() user: User,
  ): Promise<Workflow> {
    return this.workflowService.addChange(assetId, data, user.id);
  }

  @Post('/publish')
  async publish(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<Workflow> {
    return this.workflowService.publish(assetId, user.id);
  }
}
