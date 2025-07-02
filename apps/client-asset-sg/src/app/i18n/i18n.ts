import { TranslateLoader } from '@ngx-translate/core';
import { Language } from '@swissgeol/ui-core';
import { Observable, of } from 'rxjs';

import { deTranslationMapping } from './de';
import { enTranslationMapping } from './en';
import { frTranslationMapping } from './fr';
import { itTranslationMapping } from './it';

export type AppTranslationMapping = typeof deTranslationMapping;

export class AppTranslateLoader implements TranslateLoader {
  public getTranslation(lang: string): Observable<AppTranslationMapping> {
    switch (lang) {
      case Language.German:
        return of(deTranslationMapping);
      case Language.English:
        return of(enTranslationMapping);
      case Language.French:
        return of(frTranslationMapping);
      case Language.Italian:
        return of(itTranslationMapping);
      default:
        throw new Error(`Unsupported language: ${lang}`);
    }
  }
}
