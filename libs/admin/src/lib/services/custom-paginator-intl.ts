import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl {
  constructor(private translate: TranslateService) {
    super();
    this.initTranslations();
    this.translate.onLangChange.subscribe(() => {
      this.initTranslations();
    });
  }

  private initTranslations(): void {
    this.itemsPerPageLabel = this.translate.instant('paginator.itemsPerPage');
    this.changes.next();
  }
}
