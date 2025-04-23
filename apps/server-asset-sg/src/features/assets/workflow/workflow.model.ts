import { WorkflowSelectionSchema } from '@asset-sg/shared/v2';
import { PartialType } from '@nestjs/mapped-types';

export class PartialWorkflowSelectionSchema extends PartialType(WorkflowSelectionSchema) {}
