import { inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl {
  private readonly translate = inject(TranslateService);

  constructor() {
    super();
    this.initTranslations();
    this.translate.onLangChange.subscribe(() => {
      this.initTranslations();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.translate.instant('paginator.range', { start: 0, end: 0, length });
    }
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return this.translate.instant('paginator.range', { start: startIndex + 1, end: endIndex, length });
  };

  private initTranslations(): void {
    this.itemsPerPageLabel = this.translate.instant('paginator.itemsPerPage');
    this.changes.next();
  }
}
