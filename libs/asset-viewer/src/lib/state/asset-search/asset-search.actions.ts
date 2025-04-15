import { AssetSearchQuery, AssetSearchResult, AssetSearchStats } from '@asset-sg/shared';
import { createAction, props } from '@ngrx/store';
import { MapPosition } from '../../components/map/map-controller';
import { AllStudyDTO } from '../../models';

export const setQuery = createAction(
  '[Asset Search] Set Query',
  props<{
    query: Partial<AssetSearchQuery>;
  }>(),
);

export const updateSearchQuery = createAction(
  '[Asset Search] Update Query',
  props<{
    query: Partial<AssetSearchQuery>;
  }>(),
);

export const setResults = createAction(
  '[Asset Search] Set Results',
  props<{
    results?: AssetSearchResult;
    isLoading?: boolean;
  }>(),
);
export const setStats = createAction(
  '[Asset Search] Set Stats',
  props<{
    stats?: AssetSearchStats;
    isLoading?: boolean;
  }>(),
);

export const setStudies = createAction(
  '[Asset Search] Set Studies',
  props<{
    studies?: AllStudyDTO[];
    isLoading?: boolean;
  }>(),
);

export const setFiltersState = createAction('[Asset Search] Set Filters Open', props<{ state: PanelState }>());
export const setResultsState = createAction('[Asset Search] Set Results Open', props<{ state: PanelState }>());
export const setScrollOffsetForResults = createAction(
  '[Asset Search] Set Scroll Offset For Results',
  props<{ offset: number }>(),
);
export const setMapPosition = createAction('[Asset Search] Set Map Position', props<{ position: MapPosition }>());

export const resetSearch = createAction('[Asset Search] Reset Search');

export enum PanelState {
  ClosedManually,
  ClosedAutomatically,
  OpenedManually,
  OpenedAutomatically,
}

export const isPanelOpen = (state: PanelState): boolean => {
  switch (state) {
    case PanelState.ClosedManually:
    case PanelState.ClosedAutomatically:
      return false;
    case PanelState.OpenedManually:
    case PanelState.OpenedAutomatically:
      return true;
  }
};

export const isPanelAutomaticallyToggled = (state: PanelState): boolean => {
  switch (state) {
    case PanelState.ClosedManually:
    case PanelState.OpenedManually:
      return false;
    case PanelState.ClosedAutomatically:
    case PanelState.OpenedAutomatically:
      return true;
  }
};
