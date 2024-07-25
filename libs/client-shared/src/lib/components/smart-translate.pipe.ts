import { inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Lang } from '@asset-sg/shared';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CURRENT_LANG } from '../utils';

/**
 * A pipe that applies a different kind of translation depending on the value passed to it.
 * - For {@link TranslationKey}s, the key is translated using {@link TranslatePipe translate}.
 * - For {@link TranslatedValue}s, the value for the current language is used.
 */
@Pipe({
  standalone: true,
  name: 'smartTranslate',
  pure: false,
})
export class SmartTranslatePipe implements PipeTransform, OnDestroy {
  private readonly translationPipe = inject(TranslatePipe);
  private readonly currentLang$ = inject(CURRENT_LANG);
  private currentLang: Lang = 'de';
  private readonly subscription = new Subscription();

  constructor() {
    this.subscription.add(
      this.currentLang$.subscribe((currentLang) => {
        this.currentLang = currentLang;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  transform(value: Translation): string {
    if (typeof value === 'string') {
      return value;
    }
    if (isTranslationKey(value)) {
      return this.translationPipe.transform(value.key);
    }
    return value[this.currentLang];
  }
}

export type Translation = TranslationKey | TranslatedValue | string;

export interface TranslationKey {
  key: string;
}

export interface TranslatedValue {
  de: string;
  fr: string;
  rm: string;
  it: string;
  en: string;
}

const isTranslationKey = (value: unknown): value is TranslationKey =>
  typeof value == 'object' && value != null && 'key' in value && typeof value.key === 'string';
