import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CURRENT_LANG } from '@asset-sg/client-shared';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';

const LEGAL_BASE_URL = 'https://www.swissgeol.ch/datenschutz';

@Component({
  selector: 'asset-sg-disclaimer-dialog',
  templateUrl: './disclaimer-dialog.component.html',
  styleUrl: './disclaimer-dialog.component.scss',
})
export class DisclaimerDialogComponent {
  public text = '';
  private readonly dialogRef = inject(MatDialogRef<DisclaimerDialogComponent>);
  private readonly translateService = inject(TranslateService);

  private readonly currentLang$ = inject(CURRENT_LANG);
  public readonly legalUrl$ = this.currentLang$.pipe(
    map((lang) => (lang === 'de' ? LEGAL_BASE_URL : `${LEGAL_BASE_URL}-${lang}/`))
  );

  public readonly disclaimerText$ = this.currentLang$.pipe(
    map(() => this.translateService.instant(`disclaimer.content`).replaceAll('\n', '<br>'))
  );

  public close() {
    this.dialogRef.close();
  }
}
