import { IsOptional } from 'class-validator';

import { LocalDate } from '../../models/base/local-date';
import { LocalDateRange } from '../../models/base/local-date-range';
import { Schema, TransformLocalDate } from './schema';

export class LocalDateRangeSchema extends Schema implements LocalDateRange {
  @TransformLocalDate()
  min!: LocalDate;

  @TransformLocalDate()
  max!: LocalDate;
}

export class PartialDateRangeSchema extends Schema implements Partial<LocalDateRange> {
  @IsOptional()
  @TransformLocalDate()
  min?: LocalDate;

  @IsOptional()
  @TransformLocalDate()
  max?: LocalDate;
}
