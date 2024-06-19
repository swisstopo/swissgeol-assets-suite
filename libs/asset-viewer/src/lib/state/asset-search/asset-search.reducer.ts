import { appSharedStateActions, AppState } from '@asset-sg/client-shared';
import { AssetEditDetail, AssetSearchQuery, AssetSearchResult, AssetSearchStats } from '@asset-sg/shared';
import { createReducer, on } from '@ngrx/store';

import * as actions from './asset-search.actions';

export enum LoadingState {
  Loading = 'loading',
  Loaded = 'loaded',
}

export interface AssetSearchState {
  query: AssetSearchQuery;
  results: AssetSearchResult;
  stats: AssetSearchStats;
  currentAsset: AssetEditDetail | undefined;
  loadingState: LoadingState;
  assetDetailLoadingState: LoadingState;
  isMapInitialised: boolean;
  isFiltersOpen: boolean;
  isResultsOpen: boolean;
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
    geometryCodes: undefined,
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
  isFiltersOpen: true,
  isResultsOpen: false,
  loadingState: LoadingState.Loading,
  assetDetailLoadingState: LoadingState.Loading,
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
      isResultsOpen: true,
    })
  ),
  on(
    actions.updateSearchResults,
    (state, { searchResults }): AssetSearchState => ({
      ...state,
      results: searchResults,
      loadingState: LoadingState.Loaded,
    })
  ),
  on(
    actions.updateStats,
    (state, { searchStats }): AssetSearchState => ({
      ...state,
      stats: searchStats,
    })
  ),
  on(
    actions.removePolygon,
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
    (): AssetSearchState => ({
      ...initialState,
      isMapInitialised: true,
    })
  ),
  on(
    actions.searchForAssetDetail,
    (state): AssetSearchState => ({
      ...state,
      assetDetailLoadingState: LoadingState.Loading,
    })
  ),
  on(
    actions.setLoadingState,
    (state): AssetSearchState => ({
      ...state,
      loadingState: LoadingState.Loading,
    })
  ),
  on(
    actions.updateAssetDetail,
    (state, { assetDetail }): AssetSearchState => ({
      ...state,
      currentAsset: assetDetail,
      assetDetailLoadingState: LoadingState.Loaded,
    })
  ),
  on(
    actions.resetAssetDetail,
    (state): AssetSearchState => ({
      ...state,
      currentAsset: initialState.currentAsset,
      assetDetailLoadingState: initialState.assetDetailLoadingState,
    })
  ),
  on(actions.mapInitialised, (state): AssetSearchState => ({ ...state, isMapInitialised: true })),
  on(appSharedStateActions.openPanel, (state): AssetSearchState => ({ ...state, isFiltersOpen: true })),
  on(actions.openFilters, (state): AssetSearchState => ({ ...state, isFiltersOpen: true })),
  on(actions.closeFilters, (state): AssetSearchState => ({ ...state, isFiltersOpen: false })),
  on(
    appSharedStateActions.toggleSearchFilter,
    (state): AssetSearchState => ({ ...state, isFiltersOpen: !state.isFiltersOpen })
  ),
  on(actions.openResults, (state): AssetSearchState => ({ ...state, isResultsOpen: true })),
  on(actions.closeResults, (state): AssetSearchState => ({ ...state, isResultsOpen: false }))
);
