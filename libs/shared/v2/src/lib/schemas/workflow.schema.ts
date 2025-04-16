import { IsIn, IsString } from 'class-validator';
import { UserId } from '../models/user';
import { UnpublishedWorkflowStatus, WorkflowChangeData } from '../models/workflow';
import { IsNullable, messageNullableString } from '../utils/class-validator/is-nullable.decorator';
import { Schema } from './base/schema';

export class WorkflowChangeDataSchema extends Schema implements WorkflowChangeData {
  @IsString({ message: messageNullableString })
  @IsNullable()
  assigneeId!: UserId | null;

  @IsString({ message: messageNullableString })
  @IsNullable()
  comment!: string | null;

  @IsIn(UnpublishedWorkflowStatus)
  status!: UnpublishedWorkflowStatus;
}
