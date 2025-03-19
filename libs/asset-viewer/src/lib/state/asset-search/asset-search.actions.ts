import { AssetEditDetail, AssetSearchQuery, AssetSearchResult, AssetSearchStats } from '@asset-sg/shared';
import { AssetId } from '@asset-sg/shared/v2';
import { createAction, props } from '@ngrx/store';
import { AllStudyDTO } from '../../models';

export const initialize = createAction('[Asset Search] Initialize');
export const runCombinedSearch = createAction(
  '[Asset Search] Run Combined Search',
  props<{
    assetId: number | undefined;
    query: AssetSearchQuery;
  }>()
);
export const search = createAction(
  '[Asset Search] Search',
  props<{
    query: AssetSearchQuery;
  }>()
);
export const mergeQuery = createAction(
  '[Asset Search] Merge Query',
  props<{
    query: AssetSearchQuery;
  }>()
);
export const executeSearch = createAction('[Asset Search] Execute Search', props<{ query: AssetSearchQuery }>());

export const updateResults = createAction(
  '[Asset Search] Update Results',
  props<{
    results: AssetSearchResult;
  }>()
);
export const updateStats = createAction(
  '[Asset Search] Update Stats',
  props<{
    stats: AssetSearchStats;
  }>()
);
export const resetSearch = createAction('[Asset Search] Reset Search');

export const assetClicked = createAction('[Asset Search] Asset Clicked', props<{ assetId: number }>());
export const selectAsset = createAction('[Asset Search] Select Asset', props<{ assetId: AssetId }>());
export const setSelectedAsset = createAction('[Asset Search] Set Selected Asset', props<{ asset: AssetEditDetail }>());
export const clearSelectedAsset = createAction('[Asset Search] Clear Selected Asset');
export const clearPolygon = createAction('[Asset Search] Clear Polygon');
export const setStudies = createAction('[Asset Search] Set Studies', props<{ studies: AllStudyDTO[] }>());

export const openFilters = createAction('[Asset Search] Open Filters');
export const closeFilters = createAction('[Asset Search] Close Filters');
export const openResults = createAction('[Asset Search] Open Results');
export const closeResults = createAction('[Asset Search] Close Results');
export const toggleResults = createAction('[Asset Search] Toggle Results');
