import { DecimalPipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { AssetFile } from '@asset-sg/shared/v2';

@Pipe({
  name: 'fileSize',
  pure: true,
  standalone: false,
})
export class FileSizePipe implements PipeTransform {
  private readonly decimalPipe = inject(DecimalPipe);

  transform({ size }: AssetFile, locale: string): string {
    const fileSize = Math.round((size / 1024 / 1024) * 10) / 10;
    return fileSize < 0.1 ? `< 0.1 MB` : `${this.decimalPipe.transform(fileSize, '1.1-1', locale)} MB`;
  }
}
