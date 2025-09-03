import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'filePage',
  pure: true,
  standalone: false,
})
export class FilePagePipe implements PipeTransform {
  private readonly translateService = inject(TranslateService);

  transform(pageCount: number): string {
    return pageCount > 1
      ? this.translateService.instant('search.filePagePlural', { pageCount })
      : this.translateService.instant('search.filePageSingular');
  }
}
