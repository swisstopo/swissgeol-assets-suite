import { createSelector } from '@ngrx/store';
import { AppStateWithFavorites } from './favorites.reducer';

const favoritesFeature = (state: AppStateWithFavorites) => state.favorites;

export const selectFavoriteAssetIds = createSelector(favoritesFeature, (state) => state.assetIds);
export const selectIsInitialized = createSelector(favoritesFeature, (state) => state.isInitialized);
