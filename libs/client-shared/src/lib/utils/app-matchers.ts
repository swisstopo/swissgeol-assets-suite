import { UrlMatchResult, UrlSegment } from '@angular/router';

import { isSupportedLang } from '../i18n';

const validSegments = ['assets', 'favorites'];

export function assetsPageMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length === 0) {
    return null;
  }

  if (segments.length === 1) {
    const lang = segments[0].path;
    if (isSupportedLang(lang)) {
      return { consumed: segments, posParams: { lang: segments[0] } };
    }

    return null;
  }

  if (segments.length === 2) {
    const lang = segments[0].path;
    if (!isSupportedLang(lang)) {
      return null;
    }

    const path = segments[1].path;
    if (!validSegments.includes(path)) {
      return null;
    }
    return { consumed: segments, posParams: { lang: segments[0], path: segments[1] } };
  }

  return null;
}
