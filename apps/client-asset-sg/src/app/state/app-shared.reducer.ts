import { AppSharedState, appSharedStateActions } from '@asset-sg/client-shared';
import * as RD from '@devexperts/remote-data-ts';
import { createReducer, on } from '@ngrx/store';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { assetSearchActions } from '../../../../../libs/asset-viewer/src';

const initialState: AppSharedState = {
  rdUserProfile: RD.initial,
  rdReferenceData: RD.initial,
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
    appSharedStateActions.updateAsset,
    (state, { asset, shouldBeCurrentAsset }): AppSharedState => ({
      ...state,
      currentAsset: shouldBeCurrentAsset || state.currentAsset?.assetId === asset.assetId ? asset : state.currentAsset,
    }),
  ),
  on(
    appSharedStateActions.removeAsset,
    (state, { assetId }): AppSharedState => ({
      ...state,
      currentAsset: state.currentAsset?.assetId === assetId ? null : state.currentAsset,
    }),
  ),
  on(
    appSharedStateActions.loadUserProfileResult,
    (state, rdUserProfile): AppSharedState => ({ ...state, rdUserProfile }),
  ),
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
    appSharedStateActions.loadReferenceDataResult,
    (state, rdReferenceData): AppSharedState => ({ ...state, rdReferenceData }),
  ),
  on(appSharedStateActions.loadWorkgroupsResult, (state, { workgroups }): AppSharedState => ({ ...state, workgroups })),
  on(appSharedStateActions.logout, (): AppSharedState => initialState),
  on(appSharedStateActions.setLang, (state, { lang }): AppSharedState => ({ ...state, lang })),
  on(
    appSharedStateActions.createContactResult,
    (state, { type: _, ...contact }): AppSharedState => ({
      ...state,
      rdReferenceData: pipe(
        state.rdReferenceData,
        RD.map((rd) => ({
          ...rd,
          contacts: pipe(rd.contacts, R.upsertAt(String(contact.id), contact)),
        })),
      ),
    }),
  ),
  on(
    appSharedStateActions.editContactResult,
    (state, { type: _, ...contact }): AppSharedState => ({
      ...state,
      rdReferenceData: pipe(
        state.rdReferenceData,
        RD.map((rd) => ({
          ...rd,
          contacts: pipe(
            rd.contacts,
            R.updateAt(String(contact.id), contact),
            O.getOrElse(() => rd.contacts),
          ),
        })),
      ),
    }),
  ),
);
