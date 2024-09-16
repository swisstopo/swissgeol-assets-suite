import { AssetEditDetail, AssetSearchQuery, AssetSearchResult, AssetSearchStats } from '@asset-sg/shared';
import { createAction, props } from '@ngrx/store';
import { AllStudyDTOs } from '../../models';

export const search = createAction(
  '[Asset Search] Search',
  props<{
    query: Partial<AssetSearchQuery>;
  }>()
);
export const updateStats = createAction(
  '[Asset Search] Update search stats',
  props<{
    searchStats: AssetSearchStats;
  }>()
);
export const updateSearchResults = createAction(
  '[Asset Search] Update search results',
  props<{
    searchResults: AssetSearchResult;
  }>()
);
export const clearSearchText = createAction('[Asset Search] Clear search text');
export const resetSearch = createAction('[Asset Search] Reset Search');
export const removePolygon = createAction('[Asset Search] Remove polygon');
export const initializeSearch = createAction('[Asset Search] Initialize search');
export const assetClicked = createAction('[Asset Search] Asset clicked', props<{ assetId: number }>());
export const showAssetDetail = createAction('[Asset Search] Show Asset Detail', props<{ assetId: number }>());
export const updateAssetDetail = createAction(
  '[Asset Search] Update Asset Detail',
  props<{ assetDetail: AssetEditDetail }>()
);
export const resetAssetDetail = createAction('[Asset Search] Reset Asset Detail');
export const openFilters = createAction('[Asset Search] Open Filters');
export const closeFilters = createAction('[Asset Search] Close Filters');
export const openResults = createAction('[Asset Search] Open Results');
export const closeResults = createAction('[Asset Search] Close Results');
export const setStudies = createAction('[Asset Search] Load Studies', props<{ studies: AllStudyDTOs }>());
export const loadSearch = createAction('[Asset Search] Load Search', props<{ query: AssetSearchQuery }>());
export const updateQueryParams = createAction('[Asset Search] Update Query Params');
export const manualToggleResult = createAction('[Asset Search] Manual Toggle Params');
