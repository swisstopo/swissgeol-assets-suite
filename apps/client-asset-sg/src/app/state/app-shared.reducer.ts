import { AppSharedState, appSharedStateActions } from '@asset-sg/client-shared';
import * as RD from '@devexperts/remote-data-ts';
import { createReducer, on } from '@ngrx/store';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { assetSearchActions } from '../../../../../libs/asset-viewer/src';

const initialState: AppSharedState = {
  rdUserProfile: RD.initial,
  referenceData: null,
  workgroups: [],
  lang: 'de',
  isAnonymousMode: false,
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
  on(appSharedStateActions.setUserProfile, (state, rdUserProfile): AppSharedState => ({ ...state, rdUserProfile })),
  on(
    appSharedStateActions.setAnonymousMode,
    (state): AppSharedState => ({
      ...state,
      isAnonymousMode: true,
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
  on(appSharedStateActions.setLang, (state, { lang }): AppSharedState => ({ ...state, lang })),
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
