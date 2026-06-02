const CONSENT_COOKIE_NAME = 'assets_consent';
const CONSENT_SCHEMA_VERSION = 1;
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface ConsentCookie {
  analytics: boolean;
}

export const readConsentCookie = (): ConsentCookie | null => {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(CONSENT_COOKIE_NAME.length + 1)));
    if (parsed?.v !== CONSENT_SCHEMA_VERSION) return null;
    return { analytics: Boolean(parsed.analytics) };
  } catch {
    return null;
  }
};

export const writeConsentCookie = (analytics: boolean): void => {
  const payload = encodeURIComponent(JSON.stringify({ v: CONSENT_SCHEMA_VERSION, analytics }));
  const secure = globalThis.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE_NAME}=${payload}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
};
