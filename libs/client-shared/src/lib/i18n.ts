import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

export type Langs = 'de' | 'en' | 'fr' | 'it' | 'rm';

export function isSupportedLang(lang: string): lang is Langs {
  return ['de', 'en', 'fr', 'it', 'rm'].includes(lang);
}

export interface TranslationsStruct<T> {
  de: T;
  en: T;
  fr: T;
  it: T;
  rm: T;
}

export class TranslateTsLoader<T, U extends TranslationsStruct<T>> implements TranslateLoader {
  constructor(private translations: U) {}

  public getTranslation(lang: Langs): Observable<T> {
    return of(this.translations[lang]);
  }
}
