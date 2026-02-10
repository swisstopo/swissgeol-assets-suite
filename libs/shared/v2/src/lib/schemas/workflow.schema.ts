import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AssetId } from '../models/asset';
import { LocalDate } from '../models/base/local-date';
import { SimpleUser, UserId } from '../models/user';
import {
  UnpublishedWorkflowStatus,
  Workflow,
  WorkflowChange,
  WorkflowChangeData,
  WorkflowPublishData,
  WorkflowSelection,
  WorkflowStatus,
} from '../models/workflow';
import { WorkgroupId } from '../models/workgroup';
import { IsNullable, messageNullableString } from '../utils/class-validator/is-nullable.decorator';
import { Schema, TransformLocalDate } from './base/schema';

export class WorkflowChangeSchema extends Schema implements WorkflowChange {
  @Expose()
  @IsString({ message: messageNullableString })
  @IsNullable()
  comment!: string | null;

  @Expose()
  @IsNullable()
  creator!: SimpleUser | null;

  @Expose()
  @IsNullable()
  fromAssignee!: SimpleUser | null;

  @Expose()
  @IsNullable()
  toAssignee!: SimpleUser | null;

  @Expose()
  @IsEnum(WorkflowStatus)
  fromStatus!: WorkflowStatus;

  @Expose()
  @IsEnum(WorkflowStatus)
  toStatus!: WorkflowStatus;

  @Expose()
  @TransformLocalDate()
  createdAt!: LocalDate;
}

export class WorkflowPublishDataSchema extends Schema implements WorkflowPublishData {
  @Expose()
  @IsString({ message: messageNullableString })
  @IsNullable()
  comment!: string | null;
}

export class WorkflowChangeDataSchema extends Schema implements WorkflowChangeData {
  @Expose()
  @IsString({ message: messageNullableString })
  @IsNullable()
  assigneeId!: UserId | null;

  @Expose()
  @IsString({ message: messageNullableString })
  @IsNullable()
  comment!: string | null;

  @Expose()
  @IsIn(UnpublishedWorkflowStatus)
  status!: UnpublishedWorkflowStatus;

  @Expose()
  @IsOptional()
  @IsBoolean()
  hasRequestedChanges?: boolean;
}

export class WorkflowSelectionSchema extends Schema implements WorkflowSelection {
  @Expose()
  @IsBoolean()
  general!: boolean;

  @Expose()
  @IsBoolean()
  normalFiles!: boolean;

  @Expose()
  @IsBoolean()
  legalFiles!: boolean;

  @Expose()
  @IsBoolean()
  authors!: boolean;

  @Expose()
  @IsBoolean()
  initiators!: boolean;

  @Expose()
  @IsBoolean()
  suppliers!: boolean;

  @Expose()
  @IsBoolean()
  references!: boolean;

  @Expose()
  @IsBoolean()
  geometries!: boolean;

  @Expose()
  @IsBoolean()
  legacy!: boolean;
}

export class WorkflowSchema extends Schema implements Workflow {
  @Expose()
  @IsNumber()
  id!: AssetId;

  @Expose()
  @IsBoolean()
  hasRequestedChanges!: boolean;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowChangeSchema)
  changes!: WorkflowChangeSchema[];

  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkflowSelectionSchema)
  review!: WorkflowSelectionSchema;

  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkflowSelectionSchema)
  approval!: WorkflowSelectionSchema;

  @Expose()
  @IsEnum(WorkflowStatus)
  status!: WorkflowStatus;

  @Expose()
  @IsNullable()
  assignee!: SimpleUser | null;

  @Expose()
  @IsNullable()
  creator!: SimpleUser | null;

  @Expose()
  @IsNumber()
  workgroupId!: WorkgroupId;

  @Expose()
  @TransformLocalDate()
  createdAt!: LocalDate;
}
