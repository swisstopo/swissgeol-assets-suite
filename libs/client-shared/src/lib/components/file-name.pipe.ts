import { Pipe, PipeTransform } from '@angular/core';
import { AssetFile } from '@asset-sg/shared';

@Pipe({
  name: 'fileName',
  standalone: true,
})
export class FileNamePipe implements PipeTransform {
  transform(value: AssetFile): string {
    return value.nameAlias ?? value.name;
  }
}
