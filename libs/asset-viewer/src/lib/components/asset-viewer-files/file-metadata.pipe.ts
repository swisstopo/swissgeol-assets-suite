import { DecimalPipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { AssetFile } from '@asset-sg/shared/v2';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'fileMetadata',
  pure: true,
  standalone: false,
})
export class FileMetadataPipe implements PipeTransform {
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly translateService = inject(TranslateService);

  transform({ size, pageCount }: AssetFile, locale: string): string {
    const _fileSize = Math.round((size / 1024 / 1024) * 10) / 10;
    const formattedFileSize =
      _fileSize < 0.1 ? `< 0.1 MB` : `${this.decimalPipe.transform(_fileSize, '1.1-1', locale)} MB`;

    if (!pageCount) {
      return formattedFileSize;
    }

    const pageCountDisplay =
      pageCount > 1
        ? this.translateService.instant('search.filePagePlural', { pageCount })
        : this.translateService.instant('search.filePageSingular');

    return [formattedFileSize, pageCountDisplay].join(', ');
  }
}
