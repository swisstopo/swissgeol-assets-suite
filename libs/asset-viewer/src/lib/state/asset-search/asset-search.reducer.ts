import { appSharedStateActions, AppState } from '@asset-sg/client-shared';
import { AssetEditDetail, AssetSearchQuery, AssetSearchResult, AssetSearchStats } from '@asset-sg/shared';
import { createReducer, on } from '@ngrx/store';

import { AllStudyDTOs } from '../../models';
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
  isFiltersOpen: boolean;
  isResultsOpen: boolean;
  studies: AllStudyDTOs | null;
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
    manCatLabelItemCodes: [],
    usageCodes: [],
    workgroupIds: [],
    createDate: null,
  },
  isFiltersOpen: true,
  isResultsOpen: false,
  resultsLoadingState: LoadingState.Initial,
  assetDetailLoadingState: LoadingState.Initial,
  filterLoadingState: LoadingState.Initial,
  currentAsset: undefined,
  studies: null,
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
      resultsLoadingState: LoadingState.Loading,
    })
  ),
  on(
    actions.updateSearchResults,
    (state, { searchResults }): AssetSearchState => ({
      ...state,
      results: {
        page: searchResults.page,
        data: searchResults.data,
      },
      resultsLoadingState: LoadingState.Loaded,
    })
  ),
  on(
    actions.updateStats,
    (state, { searchStats }): AssetSearchState => ({
      ...state,
      stats: searchStats,
      filterLoadingState: LoadingState.Loaded,
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
    (state): AssetSearchState => ({
      ...initialState,
      stats: state.stats,
      filterLoadingState: LoadingState.Loading,
    })
  ),
  on(
    actions.assetClicked,
    (state): AssetSearchState => ({
      ...state,
      assetDetailLoadingState: LoadingState.Loading,
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
  on(appSharedStateActions.openPanel, (state): AssetSearchState => ({ ...state })),
  on(actions.openFilters, (state): AssetSearchState => ({ ...state, isFiltersOpen: true })),
  on(actions.closeFilters, (state): AssetSearchState => ({ ...state, isFiltersOpen: false })),
  on(
    appSharedStateActions.toggleSearchFilter,
    (state): AssetSearchState => ({ ...state, isFiltersOpen: !state.isFiltersOpen })
  ),
  on(actions.openResults, (state): AssetSearchState => ({ ...state, isResultsOpen: true })),
  on(actions.closeResults, (state): AssetSearchState => ({ ...state, isResultsOpen: false })),
  on(actions.manualToggleResult, (state): AssetSearchState => ({ ...state, isResultsOpen: !state.isResultsOpen })),
  on(actions.setStudies, (state, { studies }): AssetSearchState => ({ ...state, studies }))
);
