import { inject, InjectionToken } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { isNotNil, isNotNull, isTruthy } from '@asset-sg/core';
import { Lang } from '@asset-sg/shared';
import { TranslateService } from '@ngx-translate/core';
import { flow, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import queryString from 'query-string';
import { filter, map, Observable, startWith } from 'rxjs';

export const CURRENT_LANG = new InjectionToken<Observable<Lang>>('@asset-sg/client-shared/current-lang');

export function currentLangFactory(): Observable<string> {
  const translateService = inject(TranslateService);
  return translateService.onLangChange.pipe(
    startWith(null),
    map(() => translateService.currentLang as Lang),
    filter(isNotNil)
  );
}

export function getCurrentLang(): Observable<{ lang: string; path: any; queryParams: any }> {
  const router = inject(Router);
  return router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map((e) => e.urlAfterRedirects),
    startWith(router.url),
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
        }))
      )
    ),
    map((it) => O.toNullable(it)),
    filter(isNotNull)
  );
}
