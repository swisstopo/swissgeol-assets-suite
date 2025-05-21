import { AsyncPipe } from '@angular/common';
import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { setTrackingConsent } from '../../state/app-shared-state.actions';
import { AppState } from '../../state/index';
import { CURRENT_LANG } from '../../utils';
import { ButtonComponent } from '../button/button.component';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';

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
    MatCheckbox,
    FormsModule,
    AsyncPipe,
  ],
})
export class DisclaimerDialogComponent implements AfterViewInit {
  public text = '';
  public hasConsented = true;

  private readonly dialogRef = inject(MatDialogRef<DisclaimerDialogComponent>);
  private readonly store = inject(Store<AppState>);

  private readonly currentLang$ = inject(CURRENT_LANG);
  public readonly legalAnchor$ = this.currentLang$.pipe(
    map((lang) => {
      const url = `https://www.swissgeol.ch/pages/legal/${lang}.html`;
      return `<a href="${url}" target="_blank" rel="noopener nofollow">${url}</a>`;
    }),
  );

  @ViewChild('consentCheckbox') consentCheckbox!: MatCheckbox;

  ngAfterViewInit(): void {
    this.consentCheckbox.focus();
  }

  public close() {
    this.store.dispatch(setTrackingConsent({ hasConsented: this.hasConsented }));
    this.dialogRef.close();
  }
}
