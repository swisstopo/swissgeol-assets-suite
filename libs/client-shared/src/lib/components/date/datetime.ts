import { Pipe, PipeTransform } from '@angular/core';

import { DT } from '@asset-sg/core';

@Pipe({ name: 'assetSgDateTime', pure: true, standalone: true })
export class DateTimePipe implements PipeTransform {
  transform(value: Date | null): string {
    if (!DT.dateGuard.is(value)) return '';

    const { year, month, day, hour, minute, second } = fromDate(value);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(
      2,
      '0',
    )}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  }
}

const fromDate = (value: Date) => ({
  year: value.getFullYear(),
  month: value.getMonth() + 1,
  day: value.getDate(),
  hour: value.getHours(),
  minute: value.getMinutes(),
  second: value.getSeconds(),
});
