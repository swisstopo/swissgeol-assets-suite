export type Translation = TranslationKey | TranslatedValue | string;

export interface TranslationKey {
  key: string;
}

export interface TranslatedValue {
  de: string;
  fr: string;
  it: string;
  en: string;
}

export const isTranslationKey = (value: unknown): value is TranslationKey =>
  typeof value == 'object' && value != null && 'key' in value && typeof value.key === 'string';
