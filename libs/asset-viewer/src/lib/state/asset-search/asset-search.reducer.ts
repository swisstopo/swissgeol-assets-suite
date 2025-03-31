import { appSharedStateActions, AppState } from '@asset-sg/client-shared';
import {
  AssetEditDetail,
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchStats,
  GeomFromGeomText,
  LineString,
  LV95,
  makeEmptyAssetSearchResults,
  Point,
  StudyPolygon,
} from '@asset-sg/shared';
import { createReducer, on } from '@ngrx/store';
import * as E from 'fp-ts/Either';

import { getCenter } from 'ol/extent';
import { LineString as OlLineString, Polygon } from 'ol/geom';
import { DEFAULT_MAP_POSITION, MapPosition } from '../../components/map/map-controller';
import { AllStudyDTO, AllStudyDTOs } from '../../models';
import * as actions from './asset-search.actions';
import { PanelState } from './asset-search.actions';

export interface AssetSearchState {
  query: AssetSearchQuery;
  results: AssetSearchResult;
  stats: AssetSearchStats;
  studies: AllStudyDTOs;
  currentAsset: AssetEditDetail | null;
  ui: AssetSearchUiState;

  isLoadingStudies: boolean;
  isLoadingResults: boolean;
  isLoadingStats: boolean;
  isLoadingAsset: boolean;
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
  studies: [],
  results: makeEmptyAssetSearchResults(),
  stats: {
    total: 0,
    authorIds: [],
    assetKindItemCodes: [],
    languageItemCodes: [],
    geometryCodes: [],
    manCatLabelItemCodes: [],
    usageCodes: [],
    workgroupIds: [],
    createDate: null,
  },
  currentAsset: null,
  ui: {
    filtersState: PanelState.OpenedAutomatically,
    resultsState: PanelState.ClosedAutomatically,
    scrollOffsetForResults: 0,
    map: DEFAULT_MAP_POSITION,
  },

  isLoadingStudies: false,
  isLoadingResults: false,
  isLoadingStats: false,
  isLoadingAsset: false,
};

export const assetSearchReducer = createReducer(
  initialState,
  on(
    actions.setQuery,
    (state, { query }): AssetSearchState => ({
      ...state,
      query,
    })
  ),
  on(
    actions.updateSearchQuery,
    (state, { query }): AssetSearchState => ({
      ...state,
      query: {
        ...state.query,
        ...query,
      },
    })
  ),
  on(
    actions.setStudies,
    (state, { studies, isLoading }): AssetSearchState => ({
      ...state,
      studies: studies ?? state.studies,
      isLoadingStudies: isLoading ?? state.isLoadingStudies,
    })
  ),
  on(
    actions.setResults,
    (state, { results, isLoading }): AssetSearchState => ({
      ...state,
      results: results ?? state.results,
      isLoadingResults: isLoading ?? state.isLoadingResults,
    })
  ),
  on(
    actions.setStats,
    (state, { stats, isLoading }): AssetSearchState => ({
      ...state,
      stats: stats ?? state.stats,
      isLoadingStats: isLoading ?? state.isLoadingStats,
    })
  ),
  on(
    actions.setCurrentAsset,
    (state, { asset, isLoading }): AssetSearchState => ({
      ...state,
      currentAsset: asset === undefined ? state.currentAsset : asset,
      isLoadingAsset: isLoading ?? state.isLoadingAsset,
    })
  ),
  on(
    actions.setFiltersState,
    (state, { state: filtersState }): AssetSearchState => ({
      ...state,
      ui: { ...state.ui, filtersState },
    })
  ),
  on(
    actions.setResultsState,
    (state, { state: resultsState }): AssetSearchState => ({
      ...state,
      ui: { ...state.ui, resultsState },
    })
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
      currentAsset: null,
      ui: {
        ...state.ui,
        resultsState: PanelState.OpenedManually,
      },
    })
  ),
  on(
    appSharedStateActions.removeAssetFromSearch,
    (state, { assetId }): AssetSearchState => ({
      ...state,
      currentAsset: state.currentAsset?.assetId === assetId ? null : state.currentAsset,
      results: {
        ...state.results,
        data: state.results.data.filter((it) => it.assetId !== assetId),
      },
      studies: state.studies?.filter((study) => study.assetId !== assetId) ?? null,
    })
  ),

  on(appSharedStateActions.updateAssetInSearch, (state, { asset }): AssetSearchState => {
    const mapAsset = (it: AssetEditDetail): AssetEditDetail => (it.assetId === asset.assetId ? asset : it);
    return {
      ...state,
      currentAsset: state.currentAsset === null ? null : mapAsset(state.currentAsset),
      results: {
        ...state.results,
        data: state.results.data.map(mapAsset),
      },
      studies:
        state.studies
          ?.filter((study) => study.assetId !== asset.assetId)
          .concat(
            asset.studies.map((study): AllStudyDTO => {
              const centroid = (() => {
                const { right: geom } = GeomFromGeomText.decode(study.geomText) as E.Right<
                  Point | StudyPolygon | LineString
                >;
                switch (geom._tag) {
                  case 'Point':
                    return geom.coord;
                  case 'Polygon': {
                    const [x, y] = getCenter(new Polygon([geom.coords.map((it) => [it.x, it.y])]).getExtent());
                    return { x, y } as LV95;
                  }
                  case 'LineString': {
                    const [x, y] = getCenter(new OlLineString(geom.coords.map((it) => [it.x, it.y])).getExtent());
                    return { x, y } as LV95;
                  }
                }
              })();
              return {
                assetId: study.assetId,
                studyId: study.studyId,
                isPoint: study.geomText.startsWith('POINT'),
                centroid,
              };
            })
          ) ?? null,
    };
  })
);
