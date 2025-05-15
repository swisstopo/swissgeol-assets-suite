import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { AssetFile } from '@asset-sg/shared';
import { TranslatePipe } from '@ngx-translate/core';

@Pipe({
  name: 'FileMetadata',
  pure: true,
  standalone: false,
})
export class FileMetadataPipe implements PipeTransform {
  constructor(
    private readonly decimalPipe: DecimalPipe,
    private readonly translatePipe: TranslatePipe,
  ) {}

  transform(value: AssetFile, locale: string): string {
    const _fileSize = Math.round((value.size / 1024 / 1024) * 10) / 10;
    const formattedFileSize =
      _fileSize < 0.1 ? `< 0.1 MB` : `${this.decimalPipe.transform(_fileSize, '1.1-1', locale)} MB`;

    if (!value.pageCount) {
      return formattedFileSize;
    }

    const pageCount =
      value.pageCount > 1
        ? this.translatePipe.transform('search.filePagePlural', { pageCount: value.pageCount })
        : this.translatePipe.transform('search.filePageSingular');

    return [formattedFileSize, pageCount].join(', ');
  }
}
