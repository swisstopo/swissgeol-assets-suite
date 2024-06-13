import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@asset-sg/auth';
import { Lang } from '@asset-sg/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';
import queryString from 'query-string';

@UntilDestroy()
@Component({
  selector: 'asset-sg-redirect-to-lang',
  template: 'Redirect to main page...',
})
export class RedirectToLangComponent {
  constructor(route: ActivatedRoute, router: Router, authService: AuthService) {
    route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
      const paramsDecoded = D.struct({
        lang: Lang,
      }).decode(params);

      if (E.isRight(paramsDecoded)) {
        const { url, query } = queryString.parseUrl(router.url);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { lang, ...rest } = query;
        const newUrl = `/${paramsDecoded.right.lang}${url}?${queryString.stringify(rest)}`;
        router.navigateByUrl(newUrl);
      } else if (!authService.isLoggedIn()) {
        setTimeout(() => {
          router.navigate(['/de']);
        }, 500);
      } else {
        router.navigate(['/de']);
      }
    });
  }
}
