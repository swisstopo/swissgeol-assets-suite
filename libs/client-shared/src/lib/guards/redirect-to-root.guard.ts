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
  return new RedirectCommand(router.createUrlTree([languageService.language]), {
    info: 'redirectToRootGuard',
  });
};
