import { Pipe, PipeTransform } from '@angular/core';

import { DateId } from '@asset-sg/shared';

@Pipe({ name: 'assetSgDate', pure: true, standalone: true })
export class DatePipe implements PipeTransform {
  transform(value: Date | DateId): string {
    const { year, month, day } = typeof value === 'number' ? fromDateId(value) : fromDate(value);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}

const fromDate = (value: Date) => ({ year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() });

const fromDateId = (value: DateId) => ({
  year: Math.round(value / 10000),
  month: Math.round((value % 10000) / 100),
  day: value % 100,
});
