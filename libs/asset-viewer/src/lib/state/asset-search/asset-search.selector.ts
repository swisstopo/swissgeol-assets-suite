import { fromAppShared, Translation } from '@asset-sg/client-shared';
import {
  AssetSearchQuery,
  AssetSearchStats,
  AssetSearchUsageCode,
  Contact,
  GeometryType,
  LocalDateRange,
  makeEmptyAssetSearchStats,
  ReferenceDataMapping,
  SimpleWorkgroup,
  ValueCount,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import { createSelector } from '@ngrx/store';

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

export const selectSearchResultItems = createSelector(assetSearchFeature, (state) => state.results.data);

export const selectSearchStats = createSelector(
  assetSearchFeature,
  (state) => state?.stats ?? makeEmptyAssetSearchStats(),
);

export const selectGeometries = createSelector(assetSearchFeature, (state) => state.geometries);

export const selectAvailableAuthors = createSelector(
  fromAppShared.selectReferenceContacts,
  selectSearchStats,
  (contacts, stats): Array<ValueCount<Contact>> | null => {
    if (contacts === null) {
      return null;
    }
    return stats.authorIds.map((authorId) => ({
      value: contacts.get(authorId.value)!,
      count: authorId.count,
    }));
  },
);

export const selectCreatedAt = createSelector(selectSearchStats, (stats): LocalDateRange | null => stats.createdAt);

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
  getFilters: (referenceData: ReferenceDataMapping) => Array<FilterConfig<T>>,
) =>
  createSelector(
    fromAppShared.selectReferenceData,
    selectSearchQuery,
    selectSearchStats,
    (referenceData, query, stats): Array<Filter<T>> => {
      if (referenceData === null) {
        return [];
      }
      return makeFilters(
        getFilters(referenceData),

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

export const selectUsageCodeFilters = selectFilters<AssetSearchUsageCode>('usageCodes', () =>
  Object.values(AssetSearchUsageCode).map((code) => ({
    name: { key: `search.usageCode.${code}` },
    value: code,
  })),
);

export const selectAssetKindFilters = selectFilters<string>('kindCodes', (data) =>
  Object.values(data.assetKinds).map((item) => ({
    name: item.name,
    value: item.code,
  })),
);

export const selectLanguageFilters = selectFilters<string>('languageCodes', (data) => [
  ...Object.values(data.languages).map((item) => ({
    name: item.name,
    value: item.code,
  })),
  {
    name: { key: 'search.languageItem.None' },
    value: 'None',
  },
]);

export const selectGeometryFilters = selectFilters<GeometryType | 'None'>('geometryTypes', () => [
  ...Object.values(GeometryType).map((code) => ({
    name: { key: `search.geometryCode.${code}` },
    value: code,
  })),
  {
    name: { key: 'search.geometryCode.None' },
    value: 'None',
  },
]);

export const selectAssetTopicFilters = selectFilters<string>('topicCodes', (data) =>
  Object.values(data.assetTopics).map((item) => ({
    name: item.name,
    value: item.code,
  })),
);

export const selectActiveFilters = createSelector(
  selectUsageCodeFilters,
  selectAssetKindFilters,
  selectLanguageFilters,
  selectGeometryFilters,
  selectAssetTopicFilters,
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
