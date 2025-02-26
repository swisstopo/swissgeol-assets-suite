import { Pipe, PipeTransform } from '@angular/core';
import { displayFileSize } from '../../state/asset-search/asset-search.selector';

@Pipe({
  name: 'fileSizeDisplay',
  pure: true,
  standalone: false,
})
export class FileSizeDisplayPipe implements PipeTransform {
  transform(value: number, locale: string): string {
    return displayFileSize(value, locale);
  }
}
