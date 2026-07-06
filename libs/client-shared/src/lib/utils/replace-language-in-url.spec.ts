import { replaceLanguageInUrl } from './replace-language-in-url';

describe('replaceLanguageInUrl', () => {
  it('replaces a 2-char language prefix in a simple path', () => {
    expect(replaceLanguageInUrl('/de/admin', 'de', 'fr')).toBe('/fr/admin');
  });

  it('replaces the language when the URL is just the language', () => {
    expect(replaceLanguageInUrl('/de', 'de', 'fr')).toBe('/fr');
  });

  it('preserves query params', () => {
    expect(replaceLanguageInUrl('/de/admin?assetId=123&foo=bar', 'de', 'it')).toBe('/it/admin?assetId=123&foo=bar');
  });

  it('preserves fragment', () => {
    expect(replaceLanguageInUrl('/de/admin#section', 'de', 'fr')).toBe('/fr/admin#section');
  });

  it('handles deep paths', () => {
    expect(replaceLanguageInUrl('/de/admin/users/42/edit', 'de', 'en')).toBe('/en/admin/users/42/edit');
  });

  it('handles root path with trailing slash', () => {
    expect(replaceLanguageInUrl('/de/', 'de', 'fr')).toBe('/fr/');
  });
});
