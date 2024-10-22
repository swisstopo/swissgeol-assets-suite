import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/autocomplete';
import { MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { NavigationEnd, Router } from '@angular/router';
import { ButtonComponent } from '@asset-sg/client-shared';
import { isNotNull, isTruthy } from '@asset-sg/core';
import { Lang } from '@asset-sg/shared';
import { TranslateModule } from '@ngx-translate/core';
import { LetModule } from '@rx-angular/template/let';
import { flow, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import queryString from 'query-string';
import { filter, map, startWith } from 'rxjs';
import { NewlineToBrPipe } from '../../../../../../libs/client-shared/src/lib/pipes/new-lline-to-br.pipe';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';

@Component({
  selector: 'asset-sg-disclaimer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    FormsModule,
    MatDialogActions,
    MatDialogContent,
    MatError,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    ReactiveFormsModule,
    TranslateModule,
    MatDivider,
    LanguageSelectorComponent,
    NewlineToBrPipe,
    LetModule,
  ],
  templateUrl: './disclaimer-dialog.component.html',
  styleUrl: './disclaimer-dialog.component.scss',
})
export class DisclaimerDialogComponent {
  constructor(private readonly dialogRef: MatDialogRef<DisclaimerDialogComponent>, private readonly router: Router) {}

  public readonly href = 'https://www.swissgeol.ch/datenschutz';
  public readonly currentLang$ = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map((e) => e.urlAfterRedirects),
    startWith(this.router.url),
    map(
      flow(
        (url) => O.of(url.match('^/(\\w\\w)(.*)$')),
        O.filter(isTruthy),
        O.bindTo('match'),
        O.bind('lang', ({ match }) => pipe(Lang.decode(match[1]), O.fromEither)),
        O.bind('parsed', ({ match }) => O.of(queryString.parseUrl(match[2]))),
        O.map(({ lang }) => lang)
      )
    ),
    map((it) => O.toNullable(it)),
    filter(isNotNull),
    map((lang) => (lang === 'de' ? this.href : `${this.href}-${lang}/`))
  );

  public close() {
    this.dialogRef.close();
  }
}
