import { appSharedStateActions, AppState } from '@asset-sg/client-shared';
import {
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchStats,
  Coordinate,
  Geometry,
  GeometryAccessType,
  GeometryDetail,
  GeometryType,
  makeEmptyAssetSearchResults,
  makeEmptyAssetSearchStats,
  run,
} from '@asset-sg/shared/v2';
import { createReducer, on } from '@ngrx/store';

import { getCenter } from 'ol/extent';
import { LineString, Polygon } from 'ol/geom';
import { DEFAULT_MAP_POSITION, MapPosition } from '../../components/map/map-controller';
import * as actions from './asset-search.actions';
import { PanelState } from './asset-search.actions';

export interface AssetSearchState {
  query: AssetSearchQuery;
  results: AssetSearchResult;
  stats: AssetSearchStats;
  geometries: Geometry[];
  ui: AssetSearchUiState;

  isLoadingGeometries: boolean;
  isLoadingResults: boolean;
  isLoadingStats: boolean;
}

export interface AssetSearchUiState {
  scrollOffsetForResults: number;
  filtersState: PanelState;
  resultsState: PanelState;
  map: MapPosition;
}

export interface AppStateWithAssetSearch extends AppState {
  assetSearch: AssetSearchState;
}

const initialState: AssetSearchState = {
  query: {},
  geometries: [],
  results: makeEmptyAssetSearchResults(),
  stats: makeEmptyAssetSearchStats(),
  ui: {
    filtersState: PanelState.OpenedAutomatically,
    resultsState: PanelState.ClosedAutomatically,
    scrollOffsetForResults: 0,
    map: DEFAULT_MAP_POSITION,
  },

  isLoadingGeometries: false,
  isLoadingResults: false,
  isLoadingStats: false,
};

export const assetSearchReducer = createReducer(
  initialState,
  on(
    actions.setQuery,
    (state, { query }): AssetSearchState => ({
      ...state,
      query,
    }),
  ),
  on(
    actions.updateSearchQuery,
    (state, { query }): AssetSearchState => ({
      ...state,
      query: {
        ...state.query,
        ...query,
      },
    }),
  ),
  on(
    actions.setGeometries,
    (state, { geometries, isLoading }): AssetSearchState => ({
      ...state,
      geometries: geometries ?? state.geometries,
      isLoadingGeometries: isLoading ?? state.isLoadingGeometries,
    }),
  ),
  on(
    actions.setResults,
    (state, { results, isLoading }): AssetSearchState => ({
      ...state,
      results: results ?? state.results,
      isLoadingResults: isLoading ?? state.isLoadingResults,
    }),
  ),
  on(
    actions.setStats,
    (state, { stats, isLoading }): AssetSearchState => ({
      ...state,
      stats: stats ?? state.stats,
      isLoadingStats: isLoading ?? state.isLoadingStats,
    }),
  ),
  on(
    actions.setFiltersState,
    (state, { state: filtersState }): AssetSearchState => ({
      ...state,
      ui: { ...state.ui, filtersState },
    }),
  ),
  on(
    actions.setResultsState,
    (state, { state: resultsState }): AssetSearchState => ({
      ...state,
      ui: { ...state.ui, resultsState },
    }),
  ),
  on(actions.setScrollOffsetForResults, (state, { offset }): AssetSearchState => {
    return {
      ...state,
      ui: { ...state.ui, scrollOffsetForResults: offset },
    };
  }),
  on(actions.setMapPosition, (state, { position }): AssetSearchState => {
    return {
      ...state,
      ui: { ...state.ui, map: position },
    };
  }),
  on(
    actions.resetSearch,
    (state): AssetSearchState => ({
      ...state,
      query: {},
      ui: {
        ...state.ui,
        resultsState: PanelState.OpenedManually,
      },
    }),
  ),
  on(
    appSharedStateActions.removeAsset,
    (state, { assetId }): AssetSearchState => ({
      ...state,
      results: {
        ...state.results,
        data: state.results.data.filter((it) => it.id !== assetId),
      },
      geometries: state.geometries?.filter((geometry) => geometry.assetId !== assetId) ?? null,
    }),
  ),
  on(appSharedStateActions.updateAsset, (state, { asset, geometries }): AssetSearchState => {
    return {
      ...state,
      geometries: run(() => {
        if (geometries === undefined) {
          return state.geometries;
        }
        return state.geometries
          .filter((geometry) => geometry.assetId !== asset.id)
          .concat(
            geometries.map((geometry): Geometry => {
              return {
                id: geometry.id,
                type: geometry.type,
                accessType: asset.isPublic ? GeometryAccessType.Public : GeometryAccessType.Internal,
                center: extractCenterFromGeometryDetail(geometry),
                assetId: asset.id,
              };
            }),
          );
      }),
    };
  }),
);

const extractCenterFromGeometryDetail = ({ type, coordinates }: GeometryDetail): Coordinate => {
  switch (type) {
    case GeometryType.Point:
      return coordinates[0];
    case GeometryType.LineString: {
      const [x, y] = getCenter(new LineString(coordinates.map((it) => [it.x, it.y])).getExtent());
      return { x, y };
    }
    case GeometryType.Polygon: {
      const [x, y] = getCenter(new Polygon([coordinates.map((it) => [it.x, it.y])]).getExtent());
      return { x, y };
    }
  }
};
