import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsIn, IsNumber, IsString, ValidateNested } from 'class-validator';
import { AssetId } from '../models/asset';
import { LocalDate } from '../models/base/local-date';
import { SimpleUser, UserId } from '../models/user';
import {
  TabStatus,
  UnpublishedWorkflowStatus,
  Workflow,
  WorkflowChange,
  WorkflowChangeData,
  WorkflowStatus,
} from '../models/workflow';
import { WorkgroupId } from '../models/workgroup';
import { IsNullable, messageNullableString } from '../utils/class-validator/is-nullable.decorator';
import { Schema } from './base/schema';

export class WorkflowSchema extends Schema implements Workflow {
  @IsNumber()
  assetId!: AssetId;

  @IsBoolean()
  hasRequestedChanges!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowChangeSchema)
  workflowChanges!: WorkflowChangeSchema[];

  reviewedTabs!: TabStatus;

  publishedTabs!: TabStatus;

  @IsEnum(WorkflowStatus)
  status!: WorkflowStatus;

  @IsNullable()
  assignee!: SimpleUser | null;

  @IsNullable()
  creator!: SimpleUser | null;

  @IsNumber()
  workgroupId!: WorkgroupId;

  @ValidateNested()
  @Type(() => String)
  @Transform(({ value }) => LocalDate.tryParse(value))
  createdAt!: LocalDate;
}

export class WorkflowChangeSchema extends Schema implements WorkflowChange {
  @IsString({ message: messageNullableString })
  @IsNullable()
  comment!: string | null;

  @IsNullable()
  creator!: SimpleUser | null;

  @IsNullable()
  fromAssignee!: SimpleUser | null;

  @IsNullable()
  toAssignee!: SimpleUser | null;

  @IsEnum(WorkflowStatus)
  fromStatus!: WorkflowStatus;

  @IsEnum(WorkflowStatus)
  toStatus!: WorkflowStatus;

  @ValidateNested()
  @Type(() => String)
  @Transform(({ value }) => LocalDate.tryParse(value))
  createdAt!: LocalDate;
}

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
