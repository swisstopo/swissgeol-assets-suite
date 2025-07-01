import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Language, SwissgeolCoreI18n } from '@swissgeol/ui-core';
import { BehaviorSubject, combineLatestWith, filter, map, Observable, startWith } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly languageSubject = new BehaviorSubject(Language.German);

  private readonly translateService = inject(TranslateService);

  private readonly router = inject(Router);

  readonly locale$ = this.language$.pipe(
    map((lang) => {
      switch (lang) {
        case Language.German:
          return 'de-CH';
        case Language.English:
          return 'en-GB';
        case Language.French:
          return 'fr-CH';
        case Language.Italian:
          return 'it-CH';
      }
    }),
  );

  readonly languageInfos$: Observable<LanguageInfo[]> = this.language$.pipe(
    combineLatestWith(
      this.router.events.pipe(
        filter((it) => it instanceof NavigationEnd),
        startWith(null),
      ),
    ),
    map(([currentLanguage]) => {
      const pathSuffix = this.router.url.split('?')[0].split('#')[0].slice(3);
      return Object.values(Language).map((language) => ({
        language,
        path: `/${language}${pathSuffix}`,
        isActive: currentLanguage === language,
      }));
    }),
  );

  constructor() {
    this.translateService.setDefaultLang(this.language);
    this.translateService.onLangChange.subscribe((event) => {
      if (event.lang != this.language) {
        throw new Error(`Language should not be set via 'TranslateService', please use 'LanguageService'.`);
      }
    });
  }

  get language$(): Observable<Language> {
    return this.languageSubject.asObservable();
  }

  get language(): Language {
    return this.languageSubject.value;
  }

  setLanguage(language: Language): void {
    if (this.language === language) {
      return;
    }

    this.languageSubject.next(language);
    this.translateService.use(language);
    SwissgeolCoreI18n.setLanguage(language);
  }
}

export interface LanguageInfo {
  language: Language;
  path: string;
  isActive: boolean;
}
