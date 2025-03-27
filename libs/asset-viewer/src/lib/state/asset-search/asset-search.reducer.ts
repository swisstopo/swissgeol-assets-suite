import { appSharedStateActions, AppState } from '@asset-sg/client-shared';
import {
  AssetEditDetail,
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchStats,
  GeomFromGeomText,
  LineString,
  LV95,
  Point,
  StudyPolygon,
} from '@asset-sg/shared';
import { createReducer, on } from '@ngrx/store';
import * as E from 'fp-ts/Either';

import { getCenter } from 'ol/extent';
import { LineString as OlLineString, Polygon } from 'ol/geom';
import { MapPosition } from '../../components/map/map-controller';
import { AllStudyDTO } from '../../models';
import { mapAssetAccessToAccessType } from '../../utils/access-type';
import * as actions from './asset-search.actions';

export enum LoadingState {
  Initial = 'initial',
  Loading = 'loading',
  Loaded = 'loaded',
}

export interface AssetSearchState {
  query: AssetSearchQuery;
  results: AssetSearchResult;
  stats: AssetSearchStats;
  currentAsset: AssetEditDetail | undefined;
  resultsLoadingState: LoadingState;
  filterLoadingState: LoadingState;
  assetDetailLoadingState: LoadingState;
  studies: AllStudyDTO[] | null;
  ui: AssetSearchUiState;
}

export interface AssetSearchUiState {
  scrollOffsetForResults: number;
  isFiltersOpen: boolean;
  isResultsOpen: boolean;
  map: Partial<MapPosition>;
}

export interface AppStateWithAssetSearch extends AppState {
  assetSearch: AssetSearchState;
}

const initialState: AssetSearchState = {
  query: {},
  results: {
    page: {
      size: 0,
      offset: 0,
      total: 0,
    },
    data: [],
  },
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
  resultsLoadingState: LoadingState.Initial,
  assetDetailLoadingState: LoadingState.Initial,
  filterLoadingState: LoadingState.Initial,
  currentAsset: undefined,
  studies: null,
  ui: {
    isFiltersOpen: true,
    isResultsOpen: false,
    scrollOffsetForResults: 0,
    map: {},
  },
};

export const assetSearchReducer = createReducer(
  initialState,
  on(
    actions.search,
    (state, { query }): AssetSearchState => ({
      ...state,
      query: {
        ...state.query,
        ...query,
      },
    })
  ),
  on(
    actions.updateResults,
    (state, { results }): AssetSearchState => ({
      ...state,
      results,
      resultsLoadingState: LoadingState.Loaded,
    })
  ),
  on(
    actions.updateStats,
    (state, { stats }): AssetSearchState => ({
      ...state,
      stats,
      filterLoadingState: LoadingState.Loaded,
    })
  ),
  on(
    actions.selectAsset,
    (state): AssetSearchState => ({
      ...state,
      assetDetailLoadingState: LoadingState.Loading,
    })
  ),
  on(
    actions.setSelectedAsset,
    (state, { asset }): AssetSearchState => ({
      ...state,
      currentAsset: asset,
      assetDetailLoadingState: LoadingState.Loaded,
    })
  ),
  on(
    actions.clearSelectedAsset,
    (state): AssetSearchState => ({
      ...state,
      currentAsset: initialState.currentAsset,
      assetDetailLoadingState: initialState.assetDetailLoadingState,
    })
  ),
  on(
    actions.setFiltersOpen,
    (state, { isOpen }): AssetSearchState => ({
      ...state,
      ui: { ...state.ui, isFiltersOpen: isOpen === 'toggle' ? !state.ui.isFiltersOpen : isOpen },
    })
  ),
  on(actions.setResultsOpen, (state, { isOpen }): AssetSearchState => {
    return {
      ...state,
      ui: { ...state.ui, isResultsOpen: isOpen === 'toggle' ? !state.ui.isResultsOpen : isOpen },
    };
  }),
  on(actions.setScrollOffsetForResults, (state, { offset }): AssetSearchState => {
    return {
      ...state,
      ui: { ...state.ui, scrollOffsetForResults: offset },
    };
  }),
  on(actions.setMapPosition, (state, { position }): AssetSearchState => {
    return {
      ...state,
      ui: { ...state.ui, map: { ...state.ui.map, ...position } },
    };
  }),
  on(actions.setStudies, (state, { studies }): AssetSearchState => ({ ...state, studies })),
  on(
    actions.clearPolygon,
    (state): AssetSearchState => ({
      ...state,
      query: {
        ...state.query,
        polygon: undefined,
      },
    })
  ),
  on(
    actions.resetSearch,
    (state): AssetSearchState => ({
      ...initialState,
      stats: state.stats,
    })
  ),
  on(appSharedStateActions.openPanel, (state): AssetSearchState => ({ ...state })),
  on(
    appSharedStateActions.removeAssetFromSearch,
    (state, { assetId }): AssetSearchState => ({
      ...state,
      currentAsset: state.currentAsset?.assetId === assetId ? undefined : state.currentAsset,
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
      currentAsset: state.currentAsset == undefined ? undefined : mapAsset(state.currentAsset),
      results: {
        ...state.results,
        data: state.results.data.map(mapAsset),
      },
      studies:
        state.studies
          ?.filter((study) => study.assetId !== asset.assetId)
          .concat(
            asset.studies.map((study): AllStudyDTO => {
              const { centroid, geometryType } = extractCentroidFromStudy(study);
              return {
                assetId: study.assetId,
                studyId: study.studyId,
                geometryType: geometryType,
                centroid,
                accessType: mapAssetAccessToAccessType(asset),
              };
            })
          ) ?? null,
    };
  })
);

function extractCentroidFromStudy(study: { assetId: number; studyId: string; geomText: string }): {
  centroid: LV95;
  geometryType: 'Point' | 'Polygon' | 'Line';
} {
  const { right: geom } = GeomFromGeomText.decode(study.geomText) as E.Right<Point | StudyPolygon | LineString>;
  switch (geom._tag) {
    case 'Point':
      return { centroid: geom.coord, geometryType: 'Point' };
    case 'Polygon': {
      const [x, y] = getCenter(new Polygon([geom.coords.map((it) => [it.x, it.y])]).getExtent());
      return { centroid: { x, y } as LV95, geometryType: 'Polygon' };
    }
    case 'LineString': {
      const [x, y] = getCenter(new OlLineString(geom.coords.map((it) => [it.x, it.y])).getExtent());
      return { centroid: { x, y } as LV95, geometryType: 'Line' };
    }
  }
}
