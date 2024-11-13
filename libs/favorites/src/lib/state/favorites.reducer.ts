import { AppState } from '@asset-sg/client-shared';
import { AssetId } from '@asset-sg/shared/v2';
import { createReducer, on } from '@ngrx/store';
import * as actions from './favorites.actions';

export interface FavoritesState {
  isInitialized: boolean;
  assetIds: Set<AssetId>;
}

const initialState: FavoritesState = {
  isInitialized: false,
  assetIds: new Set(),
};

export interface AppStateWithFavorites extends AppState {
  favorites: FavoritesState;
}

export const favoritesReducer = createReducer(
  initialState,
  on(actions.set, (state, { assetIds }) => ({
    ...state,
    isInitialized: true,
    assetIds: new Set(assetIds),
  })),
  on(actions.add, (state, { assetId }) => {
    return {
      ...state,
      assetIds: new Set([...state.assetIds, assetId]),
    };
  }),
  on(actions.remove, (state, { assetId }) => {
    const assetIds = new Set(state.assetIds);
    assetIds.delete(assetId);
    return { ...state, assetIds };
  })
);
