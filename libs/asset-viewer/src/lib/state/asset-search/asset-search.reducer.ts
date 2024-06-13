import { createReducer, on } from '@ngrx/store';

import { AppState, appSharedStateActions } from '@asset-sg/client-shared';
import { AssetEditDetail, AssetSearchQuery, AssetSearchResult, AssetSearchStats } from '@asset-sg/shared';

import * as actions from './asset-search.actions';

export enum LoadingState {
  Initial = 'initial',
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

export interface AssetSearchState {
  query: AssetSearchQuery;
  results: AssetSearchResult;
  stats: AssetSearchStats;
  currentAsset: AssetEditDetail | undefined;
  loadingState: LoadingState;
  assetDetailLoadingState: LoadingState;
  isMapInitialised: boolean;
  isRefineAndResultsOpen: boolean;
}


export interface AppStateWithAssetSearch extends AppState {
  assetSearch: AssetSearchState;
}

const initialState: AssetSearchState = {
  query: {
    text: undefined,
    polygon: undefined,
    authorId: undefined,
    createDate: undefined,
    manCatLabelItemCodes: undefined,
    assetKindItemCodes: undefined,
    usageCodes: undefined,
    geomCodes: undefined,
    languageItemCodes: undefined,
  },
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
    usageCodes: [],
    manCatLabelItemCodes: [],
    createDate: null,
  },
  isMapInitialised: false,
  isRefineAndResultsOpen: false,
  loadingState: LoadingState.Initial,
  assetDetailLoadingState: LoadingState.Initial,
  currentAsset: undefined,
};

export const assetSearchReducer = createReducer(
  initialState,
  on(
    actions.searchByFilterConfiguration,
    (state, { filterConfiguration }): AssetSearchState => ({
      ...state,
      query: {
        ...state.query,
        ...filterConfiguration,
      },
    }),
  ),
  on(
    actions.updateSearchResults,
    (state, { searchResults }): AssetSearchState => ({
      ...state,
      results: searchResults,
      loadingState: LoadingState.Loaded,
    }),
  ),
  on(
    actions.updateStats,
    (state, { searchStats }): AssetSearchState => ({
      ...state,
      stats: searchStats,
    }),
  ),
  on(
    actions.removePolygon,
    (state): AssetSearchState => ({
      ...state,
      query: {
        ...state.query,
        polygon: undefined,
      },
    }),
  ),
  on(
    actions.resetSearch,
    (): AssetSearchState => ({
      ...initialState,
      isMapInitialised: true,
    }),
  ),
  on(
    actions.searchForAssetDetail,
    (state): AssetSearchState => ({
      ...state,
      assetDetailLoadingState: LoadingState.Loading,
    }),
  ),
  on(
    actions.setLoadingState,
    (state): AssetSearchState => ({
      ...state,
      loadingState: LoadingState.Loading,
    }),
  ),
  on(
    actions.updateAssetDetail,
    (state, { assetDetail }): AssetSearchState => ({
      ...state,
      currentAsset: assetDetail,
      assetDetailLoadingState: LoadingState.Loaded,
    }),
  ),
  on(
    actions.resetAssetDetail,
    (state): AssetSearchState => ({
      ...state,
      currentAsset: initialState.currentAsset,
      assetDetailLoadingState: initialState.assetDetailLoadingState,
    }),
  ),
  on(actions.mapInitialised, (state): AssetSearchState => ({ ...state, isMapInitialised: true })),
  on(appSharedStateActions.openPanel, (state): AssetSearchState => ({ ...state, isRefineAndResultsOpen: true })),
  on(actions.closeRefineAndResults, (state): AssetSearchState => ({ ...state, isRefineAndResultsOpen: false })),
);
