import { inject } from '@angular/core';
import { CanMatchFn, RedirectCommand, Router } from '@angular/router';
import { Language } from '@swissgeol/ui-core';
import { LanguageService } from '../services';

const languages = new Set(Object.values(Language));

const isLanguage = (language: string): language is Language => languages.has(language as Language);

export const prefixPathWithLanguageGuard: CanMatchFn = (_route, segments) => {
  const languageService = inject(LanguageService);

  const language = segments.length === 0 ? null : segments[0].path;
  if (language != null && isLanguage(language)) {
    languageService.setLanguage(language);
    return true;
  }

  const router = inject(Router);
  const segmentStrings = segments.map((it) => it.path);
  return new RedirectCommand(router.createUrlTree([languageService.language, ...segmentStrings]), {
    replaceUrl: true,
    info: 'prefixPathWithLanguageGuard',
  });
};
