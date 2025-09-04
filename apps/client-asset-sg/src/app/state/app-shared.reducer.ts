import { AppSharedState, appSharedStateActions } from '@asset-sg/client-shared';
import { createReducer, on } from '@ngrx/store';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { assetSearchActions } from '../../../../../libs/asset-viewer/src';

const initialState: AppSharedState = {
  user: null,
  referenceData: null,
  workgroups: [],
  isAnonymousMode: null,
  hasConsentedToTracking: false,
  currentAsset: null,
  isLoadingAsset: false,
};

export const appSharedStateReducer = createReducer(
  initialState,
  on(
    assetSearchActions.resetSearch,
    (state): AppSharedState => ({
      ...state,
      currentAsset: null,
    }),
  ),
  on(
    appSharedStateActions.setCurrentAsset,
    (state, { asset, isLoading }): AppSharedState => ({
      ...state,
      currentAsset: asset === undefined ? state.currentAsset : asset,
      isLoadingAsset: isLoading ?? state.isLoadingAsset,
    }),
  ),
  on(
    appSharedStateActions.removeAsset,
    (state, { assetId }): AppSharedState => ({
      ...state,
      currentAsset: state.currentAsset?.asset.id === assetId ? null : state.currentAsset,
    }),
  ),

  on(
    appSharedStateActions.updateAsset,
    (state, { asset, geometries, shouldBeCurrentAsset }): AppSharedState => ({
      ...state,
      currentAsset:
        shouldBeCurrentAsset || state.currentAsset?.asset.id === asset.id
          ? {
              asset,
              geometries: geometries ?? state.currentAsset?.geometries ?? [],
            }
          : state.currentAsset,
    }),
  ),
  on(appSharedStateActions.setUser, (state, user): AppSharedState => ({ ...state, user })),
  on(
    appSharedStateActions.setAnonymousMode,
    (state, { isAnonymous }): AppSharedState => ({
      ...state,
      isAnonymousMode: isAnonymous,
    }),
  ),
  on(
    appSharedStateActions.setTrackingConsent,
    (state, { hasConsented }): AppSharedState => ({
      ...state,
      hasConsentedToTracking: hasConsented,
    }),
  ),
  on(
    appSharedStateActions.setReferenceData,
    (state, { referenceData }): AppSharedState => ({ ...state, referenceData }),
  ),
  on(appSharedStateActions.setWorkgroups, (state, { workgroups }): AppSharedState => ({ ...state, workgroups })),
  on(appSharedStateActions.logout, (): AppSharedState => initialState),
  on(
    appSharedStateActions.storeContact,
    (state, { contact }): AppSharedState => ({
      ...state,
      referenceData:
        state.referenceData === null
          ? null
          : {
              ...state.referenceData,
              contacts: new Map([...state.referenceData.contacts, [contact.id, contact]]),
            },
    }),
  ),
);
