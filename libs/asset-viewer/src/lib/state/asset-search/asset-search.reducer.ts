import { appSharedStateActions, AppState } from '@asset-sg/client-shared';
import {
  AssetSearchResult,
  AssetSearchStats,
  Coordinate,
  FileSearchResult,
  Geometry,
  GeometryAccessType,
  GeometryDetail,
  GeometryType,
  makeEmptyAssetSearchResults,
  makeEmptyAssetSearchStats,
  makeEmptyFileSearchResults,
  run,
  SearchQueries,
  SearchType,
} from '@asset-sg/shared/v2';
import { createReducer, on } from '@ngrx/store';

import { getCenter } from 'ol/extent';
import { LineString, Polygon } from 'ol/geom';
import { DEFAULT_MAP_POSITION, MapPosition } from '../../components/map/map-controller';
import * as actions from './asset-search.actions';
import { PanelState } from './asset-search.actions';

export interface AssetSearchState {
  query: SearchQueries;
  results: AssetSearchResult;
  stats: AssetSearchStats;
  geometries: Geometry[];
  ui: AssetSearchUiState;

  /**
   * The result-list scroll offset for the Favorites view.
   *
   * The Filter and Favorites tabs share this state slice but represent two independent views.
   * Their result-list scroll positions must therefore be tracked separately, so that scrolling
   * in one tab does not overwrite the remembered scroll position of the other. The Filter view's
   * offset lives in {@link AssetSearchUiState.scrollOffsetForResults}, the Favorites view's here.
   */
  scrollOffsetForFavorites: number;

  fileResults: FileSearchResult;
  isLoadingFileResults: boolean;

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
  query: { type: SearchType.Asset },
  geometries: [],
  results: makeEmptyAssetSearchResults(),
  fileResults: makeEmptyFileSearchResults(),
  stats: makeEmptyAssetSearchStats(),
  ui: {
    filtersState: PanelState.OpenedAutomatically,
    resultsState: PanelState.ClosedAutomatically,
    scrollOffsetForResults: 0,
    map: DEFAULT_MAP_POSITION,
  },

  scrollOffsetForFavorites: 0,

  isLoadingGeometries: false,
  isLoadingResults: false,
  isLoadingFileResults: false,
  isLoadingStats: false,
};

/**
 * The Filter and Favorites tabs share this state slice but are two independent views, each with its
 * own result-list scroll position. These two helpers are the single source of truth for mapping the
 * currently active view (determined by `query.favoritesOnly`) to its scroll offset, so the reducer,
 * selector, and URL serialization all stay in sync.
 */
export const getActiveScrollOffset = (state: AssetSearchState): number =>
  state.query.favoritesOnly ? state.scrollOffsetForFavorites : state.ui.scrollOffsetForResults;

export const setActiveScrollOffset = (state: AssetSearchState, offset: number): AssetSearchState =>
  state.query.favoritesOnly
    ? { ...state, scrollOffsetForFavorites: offset }
    : { ...state, ui: { ...state.ui, scrollOffsetForResults: offset } };

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
    actions.setAssetsResults,
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
    actions.setFileResults,
    (state, { fileResults, isLoading }): AssetSearchState => ({
      ...state,
      fileResults: fileResults ?? state.fileResults,
      isLoadingFileResults: isLoading ?? state.isLoadingFileResults,
    }),
  ),
  on(
    actions.setAssetsAndFileResults,
    (state, { results, fileResults, isLoading }): AssetSearchState => ({
      ...state,
      results: results ?? state.results,
      fileResults: fileResults ?? state.fileResults,
      isLoadingFileResults: isLoading ?? state.isLoadingFileResults,
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
  on(actions.setScrollOffsetForResults, (state, { offset }): AssetSearchState => setActiveScrollOffset(state, offset)),
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
      query: { type: state.query.type, favoritesOnly: state.query.favoritesOnly },
      ui: {
        ...state.ui,
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
