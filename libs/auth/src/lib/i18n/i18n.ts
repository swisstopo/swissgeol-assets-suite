import { TranslationsStruct } from '@asset-sg/client-shared';

export const deAuthTranslations = {
  auth2: {
    reset: {
      unauthorised: 'E-Mail-Link ist ungültig oder abgelaufen',
    },
  },
};

export const enAuthTranslations: AuthTranslations = {
  auth2: {
    reset: {
      unauthorised: 'Email link is invalid or expired',
    },
  },
};

export const frAuthTranslations: AuthTranslations = {
  auth2: {
    reset: {
      unauthorised: 'FR E-Mail-Link ist ungültig oder abgelaufen',
    },
  },
};

export const itAuthTranslations: AuthTranslations = {
  auth2: {
    reset: {
      unauthorised: 'IT E-Mail-Link ist ungültig oder abgelaufen',
    },
  },
};

export const rmAuthTranslations: AuthTranslations = {
  auth2: {
    reset: {
      unauthorised: 'RM E-Mail-Link ist ungültig oder abgelaufen',
    },
  },
};

export type AuthTranslations = typeof deAuthTranslations;

export const authTranslations: TranslationsStruct<AuthTranslations> = {
  de: deAuthTranslations,
  en: enAuthTranslations,
  fr: frAuthTranslations,
  it: itAuthTranslations,
  rm: rmAuthTranslations,
};
