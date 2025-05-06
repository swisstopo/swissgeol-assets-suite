import { ValueItem } from '@asset-sg/shared';
import { TranslatedValueItem } from '../models/translated-value-item.interface';

export const mapValueItemsToTranslatedItem = (item: Record<string, ValueItem> | null): TranslatedValueItem[] => {
  if (item == null) {
    return [];
  }
  return Object.values(item).map(mapValueItemToTranslatedItem);
};

const mapValueItemToTranslatedItem = (item: ValueItem): TranslatedValueItem => {
  return {
    code: item.code,
    value: {
      de: item.nameDe,
      en: item.nameEn,
      fr: item.nameFr,
      it: item.nameIt,
    },
  };
};
