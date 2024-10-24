import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { getCurrentLang } from '@asset-sg/client-shared';
import { map } from 'rxjs';

const LEGAL_BASE_URL = 'https://www.swissgeol.ch/datenschutz';

@Component({
  selector: 'asset-sg-disclaimer-dialog',
  templateUrl: './disclaimer-dialog.component.html',
  styleUrl: './disclaimer-dialog.component.scss',
})
export class DisclaimerDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DisclaimerDialogComponent>);

  public readonly legalUrl$ = getCurrentLang().pipe(
    map(({ lang }) => (lang === 'de' ? LEGAL_BASE_URL : `${LEGAL_BASE_URL}-${lang}/`))
  );

  public close() {
    this.dialogRef.close();
  }
}
