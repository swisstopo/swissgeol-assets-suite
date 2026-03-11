import { inject } from '@angular/core';
import { CanMatchFn, RedirectCommand, Router } from '@angular/router';
import { isNotNull } from '@asset-sg/core';
import { Store } from '@ngrx/store';
import { filter, firstValueFrom } from 'rxjs';
import { LanguageService } from '../services';
import { selectIsAnonymousMode, selectUser } from '../state/app-shared-state.selectors';

export const redirectToRootGuard: CanMatchFn = async () => {
  const router = inject(Router);
  const languageService = inject(LanguageService);
  const store = inject(Store);
  const isAnonymous = await firstValueFrom(store.select(selectIsAnonymousMode).pipe(filter(isNotNull)));
  if (!isAnonymous) {
    await firstValueFrom(store.select(selectUser).pipe(filter(isNotNull)));
  }

  // keep query params when redirecting to the root path to ensure things like assetId can be shared regardless of
  // language
  const navigation = router.currentNavigation();
  const currentQueryParams = navigation?.extractedUrl.queryParams || {};

  return new RedirectCommand(
    router.createUrlTree([languageService.language], {
      queryParams: currentQueryParams,
      queryParamsHandling: 'merge',
    }),
    { info: 'redirectToRootGuard' },
  );
};
