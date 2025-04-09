import { IsEmail, IsIn, IsString } from 'class-validator';
import { WorkflowChangeData, WorkflowStatus, WorkflowStatusValues } from '../models/workflow';
import { Schema } from './base/schema';

export class WorkflowChangeDataSchema extends Schema implements WorkflowChangeData {
  @IsEmail()
  assignee!: string;

  @IsString()
  comment!: string;

  @IsIn(WorkflowStatusValues)
  toStatus!: WorkflowStatus;
}
