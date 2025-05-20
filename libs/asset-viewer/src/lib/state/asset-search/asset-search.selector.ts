import { fromAppShared, TranslatedValue, Translation } from '@asset-sg/client-shared';
import {
  AssetContactRole,
  AssetEditDetail,
  AssetSearchQuery,
  AssetSearchStats,
  Contact,
  DateIdBrand,
  DateRange,
  GeometryCode,
  makeEmptyAssetSearchStats,
  ordStatusWorkByDate,
  ReferenceData,
  UsageCode,
  usageCodes,
  ValueCount,
  ValueItem,
} from '@asset-sg/shared';
import { SimpleWorkgroup, WorkgroupId } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { createSelector } from '@ngrx/store';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import { isPanelOpen } from './asset-search.actions';
import { AppStateWithAssetSearch } from './asset-search.reducer';

const assetSearchFeature = (state: AppStateWithAssetSearch) => state.assetSearch;
export const selectFiltersState = createSelector(assetSearchFeature, (state) => state.ui.filtersState);

export const selectResultsState = createSelector(assetSearchFeature, (state) => state.ui.resultsState);

export const selectIsFiltersOpen = createSelector(selectFiltersState, isPanelOpen);

export const selectIsResultsOpen = createSelector(selectResultsState, isPanelOpen);

export const selectMapPosition = createSelector(assetSearchFeature, (state) => state.ui.map);

export const selectScrollOffsetForResults = createSelector(
  assetSearchFeature,
  (state) => state.ui.scrollOffsetForResults,
);

export const selectSearchQuery = createSelector(assetSearchFeature, (state) => state?.query ?? {});

export const selectSearchResults = createSelector(assetSearchFeature, (state) => state.results);

export const selectSearchStats = createSelector(
  assetSearchFeature,
  (state) => state?.stats ?? makeEmptyAssetSearchStats(),
);

export const selectCurrentAsset = createSelector(fromAppShared.selectCurrentAsset, (currentAsset) => currentAsset);

export const selectHasCurrentAsset = createSelector(
  fromAppShared.selectCurrentAsset,
  fromAppShared.selectIsLoadingAsset,
  (currentAsset, isLoadingAsset) => currentAsset !== null || isLoadingAsset,
);

export const selectStudies = createSelector(assetSearchFeature, (state) => state.studies);

export const selectCurrentAssetDetailVM = createSelector(
  fromAppShared.selectRDReferenceData,
  selectCurrentAsset,
  (referenceData, currentAssetDetail) => {
    if (RD.isSuccess(referenceData) && !!currentAssetDetail) {
      return makeAssetDetailVMNew(referenceData.value, currentAssetDetail);
    }
    return null as AssetDetailVM | null;
  },
);

export const selectAssetEditDetailVM = createSelector(
  fromAppShared.selectRDReferenceData,
  selectSearchResults,
  (referenceData, assets): AssetEditDetailVM[] => {
    if (!RD.isSuccess(referenceData) || !assets) {
      return [];
    }
    return assets.data.map((asset) => {
      const manCatLabelItems: ValueItem[] = asset.manCatLabelRefs.map(
        (manCatLabelItemCode) => referenceData.value.manCatLabelItems[manCatLabelItemCode],
      );
      const assetFormatItem: ValueItem = referenceData.value.assetFormatItems[asset.assetFormatItemCode];
      const assetKindItem: ValueItem = referenceData.value.assetKindItems[asset.assetKindItemCode];
      const contacts = asset.assetContacts.reduce(
        (contacts, contact) => {
          contacts[contact.role] ??= [];
          contacts[contact.role].push({
            ...referenceData.value.contacts[contact.contactId],
            role: contact.role,
          });
          return contacts;
        },
        {} as AssetEditDetailVM['contacts'],
      );
      return {
        assetId: asset.assetId,
        titlePublic: asset.titlePublic,
        createDate: asset.createDate as number & DateIdBrand,
        assetKindItem,
        assetFormatItem,
        contacts,
        manCatLabelItems,
      };
    });
  },
);

export const selectAvailableAuthors = createSelector(
  fromAppShared.selectRDReferenceData,
  selectSearchStats,
  (referenceData, stats): AvailableAuthor[] | null => {
    if (RD.isSuccess(referenceData)) {
      return stats.authorIds.map((authorId) => {
        return {
          contactId: authorId.value,
          count: authorId.count,
          name: referenceData.value.contacts[authorId.value].name,
        };
      });
    }
    return null;
  },
);

export const selectCreateDate = createSelector(selectSearchStats, (stats): DateRange | null => stats.createDate);

const makeFilters = <T>(
  configs: Array<FilterConfig<T>>,
  counts: Array<ValueCount<T>>,
  activeValues: T[] | undefined,
  queryKey: keyof AssetSearchQuery,
): Array<Filter<T>> => {
  return configs.map((filter) => makeFilter(filter, activeValues, counts, queryKey));
};

const makeFilter = <T>(
  filter: FilterConfig<T>,
  activeValues: T[] | undefined,
  counts: Array<ValueCount<T>>,
  queryKey: keyof AssetSearchQuery,
): Filter<T> => {
  const count = counts.find((counter) => counter.value === filter.value)?.count ?? 0;
  return {
    ...filter,
    count,
    queryKey,

    // For filters to be active, they need to have at least one asset that they apply to.
    // Also, if there are currently no filters selected (e.g. in the default search state),
    // then we select all available filters.
    isActive: activeValues?.includes(filter.value) ?? false,
  };
};

export const selectFilters = <T extends string>(
  queryKey: keyof AssetSearchQuery & keyof AssetSearchStats,
  getFilters: (referenceData: ReferenceData) => Array<FilterConfig<T>>,
) =>
  createSelector(
    fromAppShared.selectRDReferenceData,
    selectSearchQuery,
    selectSearchStats,
    (referenceData, query, stats): Array<Filter<T>> => {
      if (!RD.isSuccess(referenceData)) {
        return [];
      }
      return makeFilters(
        getFilters(referenceData.value),

        // Note that reading these attributes by key is insecure,
        // since both the query and the stats have attributes that don't match the types required here.
        // However, being able to use keys here (instead of functions or anything else)
        // makes using this selector a lot easier.
        // Passing invalid keys here is a programmer mistake anyway (which should be caught in testing at the latest),
        // so leaving it like this should be okay.
        stats[queryKey] as Array<ValueCount<T>>,
        query[queryKey] as T[] | undefined,

        queryKey,
      );
    },
  );

export const selectWorkgroupFilters = createSelector(
  fromAppShared.selectWorkgroups,
  selectSearchQuery,
  selectSearchStats,
  (workgroups, query, stats) => {
    // Create a mapping of workgroups by their id for easier and more performant lookup.
    const workgroupsById = new Map<WorkgroupId, SimpleWorkgroup>();
    for (const workgroup of workgroups) {
      workgroupsById.set(workgroup.id, workgroup);
    }

    // Map the workgroups with stats to filters.
    const configs: FilterConfig<WorkgroupId>[] = [];
    for (const stat of stats.workgroupIds) {
      const workgroup = workgroupsById.get(stat.value);
      if (workgroup == null) {
        continue;
      }
      workgroupsById.delete(stat.value);
      configs.push({
        name: workgroup.name,
        value: workgroup.id,
      });
    }

    // Include workgroups with no assigned assets.
    for (const workgroup of workgroupsById.values()) {
      configs.push({
        name: workgroup.name,
        value: workgroup.id,
      });
    }

    // Sort the filters so their orders stays consistent.
    configs.sort((a, b) => (a.name as string).localeCompare(b.name as string));

    return makeFilters(configs, stats.workgroupIds, query.workgroupIds, 'workgroupIds');
  },
);

export const selectUsageCodeFilters = selectFilters<UsageCode>('usageCodes', () =>
  usageCodes.map((code) => ({
    name: { key: `search.usageCode.${code}` },
    value: code,
  })),
);

export const selectAssetKindFilters = selectFilters<string>('assetKindItemCodes', (data) =>
  Object.values(data.assetKindItems).map((item) => ({
    name: makeTranslatedValueFromItemName(item),
    value: item.code,
  })),
);

export const selectLanguageFilters = selectFilters<string>('languageItemCodes', (data) => [
  ...Object.values(data.languageItems).map((item) => ({
    name: makeTranslatedValueFromItemName(item),
    value: item.code,
  })),
  {
    name: { key: 'search.languageItem.None' },
    value: 'None',
  },
]);

export const selectGeometryFilters = selectFilters<GeometryCode | 'None'>('geometryCodes', () => [
  ...Object.values(GeometryCode).map((code) => ({
    name: { key: `search.geometryCode.${code}` },
    value: code,
  })),
  {
    name: { key: 'search.geometryCode.None' },
    value: 'None',
  },
]);

export const selectManCatLabelFilters = selectFilters<string>('manCatLabelItemCodes', (data) =>
  Object.values(data.manCatLabelItems).map((item) => ({
    name: makeTranslatedValueFromItemName(item),
    value: item.code,
  })),
);

export const selectActiveFilters = createSelector(
  selectUsageCodeFilters,
  selectAssetKindFilters,
  selectLanguageFilters,
  selectGeometryFilters,
  selectManCatLabelFilters,
  selectWorkgroupFilters,
  (...filterGroups) => {
    return filterGroups.flatMap((filters) => filters.filter((filter) => filter.isActive));
  },
);

export const selectHasNoActiveFilters = createSelector(assetSearchFeature, ({ query }) =>
  Object.values(query).every((value) => value === undefined || value == false),
);

export interface AvailableAuthor {
  contactId: number;
  count: number;
  name: string;
}

export interface FullContact extends Contact {
  role?: AssetContactRole;
}

export interface Filter<T = string> {
  name: Translation;
  value: T;

  /**
   * The total number of assets within the current result set
   * that match this filter.
   */
  count: number;

  /**
   * Whether the filter is currently in effect,
   * i.e. whether assets that match it are visible.
   */
  isActive: boolean;

  /**
   * The field of {@link AssetSearchQuery} that contains this filter's values.
   */
  queryKey: keyof AssetSearchQuery;
}

type FilterConfig<T> = Pick<Filter<T>, 'name' | 'value'>;

export const makeTranslatedValueFromItemName = (item: ValueItem): TranslatedValue => ({
  de: item.nameDe,
  fr: item.nameFr,
  it: item.nameIt,
  en: item.nameEn,
});

export interface AssetEditDetailVM {
  assetId: number;
  titlePublic: string;
  createDate: number & DateIdBrand;
  assetKindItem: ValueItem;
  assetFormatItem: ValueItem;
  contacts: Record<AssetContactRole, FullContact[]>;
  manCatLabelItems: ValueItem[];
}

export type AssetDetailVM = ReturnType<typeof makeAssetDetailVMNew>;
export type AssetDetailFileVM = AssetDetailVM['assetFiles'][0];

const makeAssetDetailVMNew = (referenceData: ReferenceData, assetDetail: AssetEditDetail) => {
  const {
    assetFormatItemCode,
    assetKindItemCode,
    assetContacts,
    assetLanguages,
    manCatLabelRefs,
    typeNatRels,
    assetMain,
    subordinateAssets,
    siblingXAssets,
    siblingYAssets,
    statusWorks,
    assetFiles,
    ...rest
  } = assetDetail;
  return {
    ...rest,
    assetKindItem: referenceData.assetKindItems[assetKindItemCode],
    assetFormatItem: referenceData.assetFormatItems[assetFormatItemCode],
    assetContacts: assetContacts
      .map((contact) => {
        return { role: contact.role, contact: referenceData.contacts[contact.contactId] };
      })
      .map((contact) => makeAssetDetailContactVM(referenceData, contact)),
    languages: assetLanguages.map(({ languageItemCode: code }) => referenceData.languageItems[code]),
    manCatLabels: manCatLabelRefs.map((manCatLabelItemCode) => referenceData.manCatLabelItems[manCatLabelItemCode]),
    typeNatRels: typeNatRels.map((natRelItemCode) => referenceData.natRelItems[natRelItemCode]),
    referenceAssets: [
      ...pipe(
        assetMain,
        O.map((a) => [a]),
        O.getOrElseW(() => []),
      ),
      ...subordinateAssets,
      ...siblingXAssets,
      ...siblingYAssets,
    ],
    statusWorks: pipe(
      statusWorks,
      A.sort(ordStatusWorkByDate),
      A.map((a) => {
        const { statusWorkItemCode, ...rest } = a;
        return { ...rest, statusWork: referenceData.statusWorkItems[statusWorkItemCode] };
      }),
    ),
    assetFiles: assetFiles.map((it) => ({
      ...it,
      legalDocItem: it.legalDocItemCode == null ? null : referenceData.legalDocItems[it.legalDocItemCode],
    })),
  };
};

const makeAssetDetailContactVM = (
  referenceData: ReferenceData,
  assetContact: {
    role: AssetContactRole;
    contact: Contact;
  },
) => {
  const {
    role,
    contact: { contactKindItemCode, ...contactRest },
    ...assetContactRest
  } = assetContact;
  return {
    ...assetContactRest,
    role,
    ...contactRest,
    contactKindItem: referenceData.contactKindItems[contactKindItemCode],
  };
};
