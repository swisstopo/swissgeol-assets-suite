import { AssetEditDetail, AssetSearchQuery, AssetSearchResult, AssetSearchStats } from '@asset-sg/shared';
import { createAction, props } from '@ngrx/store';

export const searchByFilterConfiguration = createAction(
  '[Asset Search] Search by filter configuration',
  props<{
    filterConfiguration: AssetSearchQuery;
  }>()
);
export const getStats = createAction('[Asset Search] Get Stats');
export const updateStats = createAction(
  '[Asset Search] Update search stats',
  props<{
    searchStats: AssetSearchStats;
  }>()
);
export const search = createAction('[Asset Search] Search');
export const updateSearchResults = createAction(
  '[Asset Search] Update search results',
  props<{
    searchResults: AssetSearchResult;
  }>()
);
export const clearSearchText = createAction('[Asset Search] Clear search text');
export const resetSearch = createAction('[Asset Search] Reset Search');
export const removePolygon = createAction('[Asset Search] Remove polygon');
export const readParams = createAction('[Asset Search] Read Params');
export const setLoadingState = createAction('[Asset Search] Set loading state');
export const searchForAssetDetail = createAction(
  '[Asset Search] Search for asset detail',
  props<{
    assetId: number;
  }>()
);
export const updateAssetDetail = createAction(
  '[Asset Search] Update Asset Detail',
  props<{
    assetDetail: AssetEditDetail;
  }>()
);
export const resetAssetDetail = createAction('[Asset Search] Reset Asset Detail');
export const mapInitialised = createAction('[Asset Search] Map Initialised');
export const closeRefineAndResults = createAction('[Asset Search] Close Refine and Results');
