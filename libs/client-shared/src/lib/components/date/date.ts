import { Pipe, PipeTransform } from '@angular/core';
import { LocalDate } from '@asset-sg/shared/v2';

@Pipe({ name: 'assetSgDate', pure: true, standalone: true })
export class DatePipe implements PipeTransform {
  transform(value: Date | LocalDate): string {
    const { year, month, day } = value instanceof Date ? fromDate(value) : value;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}

const fromDate = (value: Date) => ({ year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() });
