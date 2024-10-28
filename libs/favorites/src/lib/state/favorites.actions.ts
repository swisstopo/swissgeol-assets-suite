import { AssetId } from '@asset-sg/shared/v2';
import { createAction, props } from '@ngrx/store';

export const initialize = createAction('[Favorites] Initialize');
export const load = createAction('[Favorites] Load');
export const set = createAction('[Favorites] Set', props<{ assetIds: AssetId[] }>());
export const add = createAction('[Favorites] Add', props<{ assetId: AssetId }>());
export const remove = createAction('[Favorites] Remove', props<{ assetId: AssetId }>());
