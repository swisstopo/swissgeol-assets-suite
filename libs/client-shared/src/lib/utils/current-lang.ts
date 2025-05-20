import { inject, InjectionToken } from '@angular/core';
import { isNotNil } from '@asset-sg/core';
import { Lang } from '@asset-sg/shared';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, Observable, startWith } from 'rxjs';

export const CURRENT_LANG = new InjectionToken<Observable<Lang>>('@asset-sg/client-shared/current-lang');

export function currentLangFactory(): Observable<string> {
  const translateService = inject(TranslateService);
  return translateService.onLangChange.pipe(
    startWith(null),
    map(() => translateService.currentLang as Lang),
    filter(isNotNil),
  );
}
