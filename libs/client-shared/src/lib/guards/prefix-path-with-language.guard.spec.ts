import { TestBed } from '@angular/core/testing';
import { Router, UrlSegment } from '@angular/router';
import { Language } from '@swissgeol/ui-core';

import { LanguageService } from '../services';
import { prefixPathWithLanguageGuard } from './prefix-path-with-language.guard';

describe('prefixPathWithLanguageGuard', () => {
  let languageService: { language: Language; setLanguage: jest.Mock };
  let router: { currentNavigation: jest.Mock; createUrlTree: jest.Mock };

  beforeEach(() => {
    languageService = {
      language: Language.German,
      setLanguage: jest.fn(),
    };
    router = {
      currentNavigation: jest.fn().mockReturnValue({ extractedUrl: { queryParams: {} } }),
      createUrlTree: jest.fn().mockReturnValue('/mock-tree'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LanguageService, useValue: languageService },
        { provide: Router, useValue: router },
      ],
    });
  });

  const runGuard = (segments: UrlSegment[]) =>
    TestBed.runInInjectionContext(() => prefixPathWithLanguageGuard({} as any, segments));

  it('returns true and sets language when first segment is a valid language', () => {
    const segments = [new UrlSegment('fr', {}), new UrlSegment('admin', {})];
    const result = runGuard(segments);

    expect(result).toBe(true);
    expect(languageService.setLanguage).toHaveBeenCalledWith(Language.French);
  });

  it('returns true without calling setLanguage when language already matches', () => {
    const segments = [new UrlSegment('de', {}), new UrlSegment('admin', {})];
    const result = runGuard(segments);

    expect(result).toBe(true);
    // setLanguage is called — the guard always calls it, the service itself short-circuits
    expect(languageService.setLanguage).toHaveBeenCalledWith(Language.German);
  });

  it('redirects with language prefix when first segment is not a language', () => {
    const segments = [new UrlSegment('admin', {}), new UrlSegment('users', {})];
    const result = runGuard(segments);

    expect(router.createUrlTree).toHaveBeenCalledWith(['de', 'admin', 'users'], { queryParams: {} });
    expect(result).toBeDefined();
    expect(result).not.toBe(true);
  });

  it('redirects with language prefix when segments are empty', () => {
    const result = runGuard([]);

    expect(router.createUrlTree).toHaveBeenCalledWith(['de'], { queryParams: {} });
    expect(result).toBeDefined();
    expect(result).not.toBe(true);
  });

  it('preserves query params from the current navigation when redirecting', () => {
    router.currentNavigation.mockReturnValue({
      extractedUrl: { queryParams: { assetId: '123', foo: 'bar' } },
    });

    const segments = [new UrlSegment('admin', {})];
    runGuard(segments);

    expect(router.createUrlTree).toHaveBeenCalledWith(['de', 'admin'], {
      queryParams: { assetId: '123', foo: 'bar' },
    });
  });

  it('handles missing currentNavigation gracefully', () => {
    router.currentNavigation.mockReturnValue(null);

    const segments = [new UrlSegment('admin', {})];
    runGuard(segments);

    expect(router.createUrlTree).toHaveBeenCalledWith(['de', 'admin'], { queryParams: {} });
  });

  it('recognizes all supported languages', () => {
    for (const lang of Object.values(Language)) {
      const segments = [new UrlSegment(lang, {})];
      const result = runGuard(segments);

      expect(result).toBe(true);
      expect(languageService.setLanguage).toHaveBeenCalledWith(lang);
    }
  });

  it('does not treat an invalid language code as valid', () => {
    const segments = [new UrlSegment('xx', {})];
    const result = runGuard(segments);

    expect(result).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalled();
  });
});
