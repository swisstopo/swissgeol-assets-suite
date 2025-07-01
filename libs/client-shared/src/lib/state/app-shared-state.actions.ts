import { Lang } from '@asset-sg/shared';
import {
  Asset,
  AssetId,
  Contact,
  GeometryDetail,
  ReferenceDataMapping,
  SimpleWorkgroup,
  User,
} from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { createAction, props } from '@ngrx/store';

import { ApiError } from '../utils';

export const loadReferenceData = createAction('[App Shared State] Load Reference Data');
export const setReferenceData = createAction(
  '[App Shared State] Set Reference Data',
  props<{ referenceData: ReferenceDataMapping }>(),
);

export const storeContact = createAction('[App Shared State] Store Contact', props<{ contact: Contact }>());

export const loadUserProfile = createAction('[App Shared State] Load User Profile');

export const setAnonymousMode = createAction('[App Shared State] Set Viewer Mode');

export const setTrackingConsent = createAction(
  '[App Shared State] Set Tracking Consent',
  props<{ hasConsented: boolean }>(),
);

export const setUserProfile = createAction(
  '[App Shared State] Set User Profile',
  props<RD.RemoteData<ApiError, User>>(),
);

export const loadWorkgroups = createAction('[App Shared State] Load Workgroups');
export const setWorkgroups = createAction(
  '[App Shared State] Set Workgroups',
  props<{ workgroups: SimpleWorkgroup[] }>(),
);

export const logout = createAction('[App Shared State] Logout');

export const setLang = createAction('[App Shared State] Set Lang', props<{ lang: Lang }>());

export const setCurrentAsset = createAction(
  '[Asset Search] Set Current Asset',
  props<{
    asset?: null | {
      asset: Asset;
      geometries: GeometryDetail[];
    };
    isLoading?: boolean;
  }>(),
);

/**
 * Updates all instances of an asset with a new value.
 * If the asset is not referenced anywhere, the state does not change.
 */
export const updateAsset = createAction(
  '[App Shared State] Update Asset',
  props<{
    asset: Asset;
    geometries?: GeometryDetail[];
    shouldBeCurrentAsset?: boolean;
  }>(),
);

/**
 * Removes all instances of an asset.
 * If the asset is not referenced anywhere, the state does not change.
 */
export const removeAsset = createAction('[App Shared State] Remove Asset From State', props<{ assetId: AssetId }>());
