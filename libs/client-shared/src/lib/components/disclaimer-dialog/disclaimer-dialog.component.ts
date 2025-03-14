import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { LetModule } from '@rx-angular/template/let';
import { map } from 'rxjs';
import { setTrackingConsent } from '../../state/app-shared-state.actions';
import { AppState } from '../../state/index';
import { CURRENT_LANG } from '../../utils';
import { ButtonComponent } from '../button/button.component';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';

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
    TranslateModule,
    LetModule,
    MatCheckbox,
    FormsModule,
  ],
})
export class DisclaimerDialogComponent {
  public text = '';
  public hasConsented = true;

  private readonly dialogRef = inject(MatDialogRef<DisclaimerDialogComponent>);
  private readonly store = inject(Store<AppState>);

  private readonly currentLang$ = inject(CURRENT_LANG);
  public readonly legalUrl$ = this.currentLang$.pipe(
    map((lang) => (lang === 'de' ? LEGAL_BASE_URL : `${LEGAL_BASE_URL}-${lang}/`))
  );

  public close() {
    this.store.dispatch(setTrackingConsent({ hasConsented: this.hasConsented }));
    this.dialogRef.close();
  }
}
