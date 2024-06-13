import { TranslationsStruct } from '@asset-sg/client-shared';

import { deAppTranslations } from './de';
import { enAppTranslations } from './en';
import { frAppTranslations } from './fr';
import { itAppTranslations } from './it';
import { rmAppTranslations } from './rm';

export type AppTranslations = typeof deAppTranslations;

export const appTranslations: TranslationsStruct<AppTranslations> = {
  de: deAppTranslations,
  en: enAppTranslations,
  fr: frAppTranslations,
  it: itAppTranslations,
  rm: rmAppTranslations,
};
