/**
 * Replaces the language prefix in a URL string.
 *
 * @example replaceLanguageInUrl('/de/admin?x=1#top', 'de', 'fr') → '/fr/admin?x=1#top'
 */
export function replaceLanguageInUrl(currentUrl: string, currentLang: string, newLang: string): string {
  return `/${newLang}${currentUrl.substring(currentLang.length + 1)}`;
}
