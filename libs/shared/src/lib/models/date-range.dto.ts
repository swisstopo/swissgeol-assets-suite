import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

import { DateRange } from './date-range';

export class DateRangeDTO implements DateRange {
  @IsDate()
  @Type(() => Date)
  min!: Date

  @IsDate()
  @Type(() => Date)
  max!: Date
}

export class PartialDateRangeDTO implements Partial<DateRange> {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  min?: Date

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  max?: Date
}
