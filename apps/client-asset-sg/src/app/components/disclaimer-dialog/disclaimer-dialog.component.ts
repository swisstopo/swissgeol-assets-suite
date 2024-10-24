import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { isNotNull, isTruthy } from '@asset-sg/core';
import { Lang } from '@asset-sg/shared';
import { flow, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import queryString from 'query-string';
import { filter, map, startWith } from 'rxjs';

const LEGAL_BASE_URL = 'https://www.swissgeol.ch/datenschutz';

@Component({
  selector: 'asset-sg-disclaimer-dialog',
  templateUrl: './disclaimer-dialog.component.html',
  styleUrl: './disclaimer-dialog.component.scss',
})
export class DisclaimerDialogComponent {
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<DisclaimerDialogComponent>);

  public readonly legalUrl$ = this.router.events.pipe(
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
    map((lang) => (lang === 'de' ? LEGAL_BASE_URL : `${LEGAL_BASE_URL}-${lang}/`))
  );

  public close() {
    this.dialogRef.close();
  }
}
