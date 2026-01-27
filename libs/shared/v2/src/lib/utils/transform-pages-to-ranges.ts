import {
  PageCategory,
  PageClassification,
  PageRangeClassification,
  SupportedPageLanguage,
} from '../models/page-classification';
import { isDeepEqual } from './is-deep-equal';

/**
 * Transforms a list of individual page classifications into a list of page range classifications.
 * @param pages
 */
export const transformPagesToRanges = (pages: PageClassification[]): PageRangeClassification[] => {
  const pageMap = new Map<number, { categories: Set<PageCategory>; languages: Set<SupportedPageLanguage> }>();
  pages.forEach((page) => {
    if (!pageMap.has(page.page)) {
      pageMap.set(page.page, {
        categories: new Set(page.categories),
        languages: new Set(page.languages),
      });
    } else {
      const entry = pageMap.get(page.page)!;
      page.categories.forEach((cat) => entry.categories.add(cat));
      page.languages.forEach((lang) => entry.languages.add(lang));
    }
  });

  const sortedPages: PageClassification[] = Array.from(pageMap.entries())
    .sort(([pageA], [pageB]) => pageA - pageB)
    .map(([page, { categories, languages }]) => ({
      page,
      categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
      languages: Array.from(languages).sort((a, b) => a.localeCompare(b)),
    }));

  const ranges: PageRangeClassification[] = [];
  let currentRange: PageRangeClassification | null = null;
  for (const page of sortedPages) {
    if (
      currentRange &&
      isDeepEqual(page.categories, currentRange.categories) &&
      isDeepEqual(page.languages, currentRange.languages)
    ) {
      currentRange.to = page.page;
    } else {
      currentRange = {
        from: page.page,
        to: page.page,
        categories: page.categories,
        languages: page.languages,
      };
      ranges.push(currentRange);
    }
  }

  return ranges;
};
