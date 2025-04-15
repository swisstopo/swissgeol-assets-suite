import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { isNotNull, isTruthy } from '@asset-sg/core';
import { Lang } from '@asset-sg/shared';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { flow, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import queryString from 'query-string';
import { debounceTime, filter, map, startWith } from 'rxjs';
import { supportedLangs } from '../../i18n';
import { AnchorComponent } from '../button';

@Component({
  selector: 'asset-sg-language-selector',
  standalone: true,
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  imports: [SvgIconComponent, MatMenu, MatMenuTrigger, RouterLink, MatButton, AnchorComponent, AsyncPipe],
})
export class LanguageSelectorComponent {
  private readonly router = inject(Router);

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
        O.map(({ parsed, lang }) => ({
          lang,
          path: parsed.url,
          queryParams: parsed.query,
        })),
      ),
    ),
    map((it) => O.toNullable(it)),
    filter(isNotNull),
  );

  public readonly languages$ = this.currentLang$.pipe(
    debounceTime(0),
    map((currentLang) =>
      supportedLangs.map((lang) => ({
        isActive: lang === currentLang.lang,
        lang: lang.toUpperCase(),
        params: [`/${lang}${currentLang.path}`],
        queryParams: currentLang.queryParams,
      })),
    ),
  );
}
