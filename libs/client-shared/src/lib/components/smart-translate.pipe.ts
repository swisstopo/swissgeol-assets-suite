import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isTranslationKey, Translation } from '../models/translation.model';
import { LanguageService } from '../services';

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
export class SmartTranslatePipe implements PipeTransform {
  private readonly translateService = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  transform(value: Translation): string {
    if (typeof value === 'string') {
      return value;
    }
    if (isTranslationKey(value)) {
      return this.translateService.instant(value.key);
    }
    return value[this.languageService.language];
  }
}
