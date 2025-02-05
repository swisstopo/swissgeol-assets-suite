import { faker } from '@faker-js/faker';
import { LanguageItem } from '@prisma/client';

export const fakeLanguageItemCode = (): string =>
  faker.helpers.arrayElement(languageItems.map((item) => item.languageItemCode));

export const languageItems: LanguageItem[] = [
  {
    languageItemCode: 'EN',
    geolCode: 'No-GeolCode-specified',
    name: 'english',
    nameDe: 'englisch',
    nameFr: 'anglais',
    nameIt: 'inglese',
    nameEn: 'english',
    description: 'Asset in English',
    descriptionDe: 'Asset in Englisch',
    descriptionFr: 'Asset en anglais',
    descriptionIt: 'Asset in inglese',
    descriptionEn: 'Asset in English',
  },
  {
    languageItemCode: 'IT',
    geolCode: 'No-GeolCode-specified',
    name: 'italian',
    nameDe: 'italienisch',
    nameFr: 'italien',
    nameIt: 'italiano',
    nameEn: 'italian',
    description: 'Asset in Italian',
    descriptionDe: 'Asset in Italienisch',
    descriptionFr: 'Asset en italien',
    descriptionIt: 'Elemento in italiano',
    descriptionEn: 'Asset in Italian',
  },
  {
    languageItemCode: 'FR',
    geolCode: 'No-GeolCode-specified',
    name: 'french',
    nameDe: 'französisch',
    nameFr: 'français',
    nameIt: 'francese',
    nameEn: 'french',
    description: 'Asset in French',
    descriptionDe: 'Asset in Französisch',
    descriptionFr: 'Asset en français',
    descriptionIt: 'Elemento in francese',
    descriptionEn: 'Asset in French',
  },
  {
    languageItemCode: 'DE',
    geolCode: 'No-GeolCode-specified',
    name: 'german',
    nameDe: 'deutsch',
    nameFr: 'allemand',
    nameIt: 'tedesco',
    nameEn: 'german',
    description: 'Asset in German',
    descriptionDe: 'Asset in Deutsch',
    descriptionFr: 'Asset en allemand',
    descriptionIt: 'Elemento in tedesco',
    descriptionEn: 'Asset in German',
  },
  {
    languageItemCode: 'other',
    geolCode: 'No-GeolCode-specified',
    name: 'other languages',
    nameDe: 'andere Sprachen',
    nameFr: 'autres langues',
    nameIt: 'altre lingue',
    nameEn: 'other languages',
    description: 'Asset in other languages',
    descriptionDe: 'Asset in anderer Sprachen',
    descriptionFr: "Assets dans d'autres langues",
    descriptionIt: 'Elemento in altre lingue',
    descriptionEn: 'Asset in other languages',
  },
  {
    languageItemCode: 'NUM',
    geolCode: 'No-GeolCode-specified',
    name: 'numeric',
    nameDe: 'numerisch',
    nameFr: 'numérique',
    nameIt: 'numerico',
    nameEn: 'numeric',
    description: 'Asset with numerical structure, e.g. programme code, configurations',
    descriptionDe: 'Asset mit numerischem Aufbau, wie z.B. Programmcode, Konfigurationen',
    descriptionFr: 'Asset à structure numérique, p. ex. code de programme, configurations',
    descriptionIt: 'Elemento con struttura numerica, ad es. codice programma, configurazioni',
    descriptionEn: 'Asset with numerical structure, e.g. programme code, configurations',
  },
];
