import { IsEmail, IsIn, IsString } from 'class-validator';
import { UnpublishedWorkflowStatus, WorkflowChangeData } from '../models/workflow';
import { IsNullable, messageNullableString } from '../utils/class-validator/is-nullable.decorator';
import { Schema } from './base/schema';

export class WorkflowChangeDataSchema extends Schema implements WorkflowChangeData {
  @IsEmail()
  assignee!: string;

  @IsString({ message: messageNullableString })
  @IsNullable()
  comment!: string | null;

  @IsIn(UnpublishedWorkflowStatus)
  status!: UnpublishedWorkflowStatus;
}
