import { readConsentCookie, writeConsentCookie } from './consent-cookie';

describe('consent-cookie', () => {
  beforeEach(() => {
    // Clear all cookies before each test.
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; Max-Age=0; Path=/`;
    });
  });

  describe('readConsentCookie', () => {
    it('returns null when no cookie is set', () => {
      expect(readConsentCookie()).toBeNull();
    });

    it('returns null when the cookie has an unknown schema version', () => {
      const payload = encodeURIComponent(JSON.stringify({ v: 999, analytics: true }));
      document.cookie = `assets_consent=${payload}; Path=/`;
      expect(readConsentCookie()).toBeNull();
    });

    it('returns null when the cookie value is not valid JSON', () => {
      document.cookie = `assets_consent=not-valid-json; Path=/`;
      expect(readConsentCookie()).toBeNull();
    });

    it('returns the stored consent with analytics true', () => {
      const payload = encodeURIComponent(JSON.stringify({ v: 1, analytics: true }));
      document.cookie = `assets_consent=${payload}; Path=/`;
      expect(readConsentCookie()).toEqual({ analytics: true });
    });

    it('returns the stored consent with analytics false', () => {
      const payload = encodeURIComponent(JSON.stringify({ v: 1, analytics: false }));
      document.cookie = `assets_consent=${payload}; Path=/`;
      expect(readConsentCookie()).toEqual({ analytics: false });
    });
  });

  describe('writeConsentCookie', () => {
    it('persists analytics true so readConsentCookie returns it', () => {
      writeConsentCookie(true);
      expect(readConsentCookie()).toEqual({ analytics: true });
    });

    it('persists analytics false so readConsentCookie returns it', () => {
      writeConsentCookie(false);
      expect(readConsentCookie()).toEqual({ analytics: false });
    });

    it('overwrites a previously stored consent value', () => {
      writeConsentCookie(true);
      writeConsentCookie(false);
      expect(readConsentCookie()).toEqual({ analytics: false });
    });
  });
});
