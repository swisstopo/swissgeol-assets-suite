import { LanguageCode } from './reference-data';

export const SupportedPageLanguages = ['de', 'fr', 'it', 'en'] as const;
export type SupportedPageLanguage = (typeof SupportedPageLanguages)[number];

export enum PageCategory {
  Text = 't',
  Boreprofile = 'b',
  Map = 'm',
  GeoProfile = 'gp',
  TitlePage = 'tp',
  Diagram = 'd',
  Table = 'tbl',
  Unknown = 'u',
}

// The order in which the categories should be displayed in the UI; must include all PageCategory values
const PAGE_CATEGORY_ORDER = [
  PageCategory.TitlePage,
  PageCategory.Map,
  PageCategory.Diagram,
  PageCategory.GeoProfile,
  PageCategory.Boreprofile,
  PageCategory.Text,
  PageCategory.Table,
  PageCategory.Unknown,
] as const satisfies readonly PageCategory[];
type MissingCategories = Exclude<PageCategory, (typeof PAGE_CATEGORY_ORDER)[number]>;
const _assertAllCategoriesHandled: MissingCategories extends never ? true : never = true;
const PAGE_CATEGORY_INDEX: Record<PageCategory, number> = PAGE_CATEGORY_ORDER.reduce(
  (acc, category, index) => {
    acc[category] = index;
    return acc;
  },
  {} as Record<PageCategory, number>,
);

export interface PageClassification {
  page: number;
  languages: SupportedPageLanguage[];
  categories: PageCategory[];
}

export interface PageRangeClassification extends Omit<PageClassification, 'page'> {
  from: number;
  to: number;
}

type GroupedPageClassification = {
  category: PageCategory;
  classifications: PageRangeClassification[];
};
type PageContent = {
  groupedPageClassifications: GroupedPageClassification[];
  languages: SupportedPageLanguage[];
};
export const getLanguageCodesOfPages = (pages: Array<{ languages: SupportedPageLanguage[] }>): Set<LanguageCode> => {
  return pages.reduce((acc, page) => {
    for (const lang of page.languages) {
      acc.add(mapSupportedPageLanguageToCode(lang));
    }
    return acc;
  }, new Set<LanguageCode>());
};
export const mapSupportedPageLanguageToCode = (language: SupportedPageLanguage): LanguageCode =>
  language.toUpperCase() as LanguageCode;
export const sortPageCategories = (categories: PageCategory[]): PageCategory[] => {
  return [...categories].sort((a, b) => PAGE_CATEGORY_INDEX[a] - PAGE_CATEGORY_INDEX[b]);
};
export const extractGroupedPageRageClassifications = (
  pageRangeClassifications: PageRangeClassification[],
): PageContent => {
  const languages = new Set<SupportedPageLanguage>();
  const categories = new Set<PageCategory>();
  const grouped = new Map<PageCategory, PageRangeClassification[]>();

  pageRangeClassifications.forEach((pc) => {
    pc.categories.forEach((category) => {
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(pc);
      categories.add(category);
    });
    pc.languages.forEach((language) => languages.add(language));
  });

  const sortedCategories = sortPageCategories(Array.from(categories));

  return {
    groupedPageClassifications: sortedCategories.map((category) => ({
      category,
      classifications: grouped.get(category)!,
    })),
    languages: Array.from(languages).sort((a, b) => a.localeCompare(b)),
  };
};
