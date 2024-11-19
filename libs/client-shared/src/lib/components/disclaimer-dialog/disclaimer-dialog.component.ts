import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LetModule } from '@rx-angular/template/let';
import { map } from 'rxjs';
import { ButtonComponent } from '../../components/button';
import { LanguageSelectorComponent } from '../../components/language-selector';
import { CURRENT_LANG } from '../../utils';

const LEGAL_BASE_URL = 'https://www.swissgeol.ch/datenschutz';

@Component({
  standalone: true,
  selector: 'asset-sg-disclaimer-dialog',
  templateUrl: './disclaimer-dialog.component.html',
  styleUrl: './disclaimer-dialog.component.scss',
  imports: [
    LanguageSelectorComponent,
    MatDivider,
    MatDialogActions,
    MatDialogContent,
    ButtonComponent,
    AsyncPipe,
    TranslateModule,
    LetModule,
  ],
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
