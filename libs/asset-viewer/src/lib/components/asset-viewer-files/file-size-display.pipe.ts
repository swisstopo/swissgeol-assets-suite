import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  pure: true,
  standalone: false,
})
export class FileSizePipe implements PipeTransform {
  constructor(private readonly decimalPipe: DecimalPipe) {}

  transform(value: number, locale: string): string {
    const _fileSize = Math.round((value / 1024 / 1024) * 10) / 10;
    return _fileSize < 0.1 ? `< 0.1 MB` : `${this.decimalPipe.transform(_fileSize, '1.1-1', locale)} MB`;
  }
}
