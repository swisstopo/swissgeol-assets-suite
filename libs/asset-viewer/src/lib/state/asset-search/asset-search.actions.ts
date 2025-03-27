import { AssetEditDetail, AssetSearchQuery, AssetSearchResult, AssetSearchStats } from '@asset-sg/shared';
import { createAction, props } from '@ngrx/store';
import { MapPosition } from '../../components/map/map-controller';
import { AllStudyDTOs } from '../../models';

export const setQuery = createAction(
  '[Asset Search] Set Query',
  props<{
    query: Partial<AssetSearchQuery>;
  }>()
);

export const updateSearchQuery = createAction(
  '[Asset Search] Update Query',
  props<{
    query: Partial<AssetSearchQuery>;
  }>()
);

export const setResults = createAction(
  '[Asset Search] Set Results',
  props<{
    results?: AssetSearchResult;
    isLoading?: boolean;
  }>()
);
export const setStats = createAction(
  '[Asset Search] Set Stats',
  props<{
    stats?: AssetSearchStats;
    isLoading?: boolean;
  }>()
);

export const setStudies = createAction(
  '[Asset Search] Set Studies',
  props<{
    studies?: AllStudyDTOs;
    isLoading?: boolean;
  }>()
);

export const setCurrentAsset = createAction(
  '[Asset Search] Set Current Asset',
  props<{
    asset?: AssetEditDetail | null;
    isLoading?: boolean;
  }>()
);

export const setFiltersOpen = createAction('[Asset Search] Set Filters Open', props<{ isOpen: boolean | 'toggle' }>());
export const setResultsOpen = createAction('[Asset Search] Set Results Open', props<{ isOpen: boolean | 'toggle' }>());
export const setScrollOffsetForResults = createAction(
  '[Asset Search] Set Scroll Offset For Results',
  props<{ offset: number }>()
);
export const setMapPosition = createAction('[Asset Search] Set Map Position', props<{ position: MapPosition }>());

export const resetSearch = createAction('[Asset Search] Reset Search');
