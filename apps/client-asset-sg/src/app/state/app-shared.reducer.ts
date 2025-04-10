import { assetSearchActions } from '@asset-sg/asset-viewer';
import { AppSharedState, appSharedStateActions } from '@asset-sg/client-shared';
import { AssetEditDetail } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { createReducer, on } from '@ngrx/store';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';

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
    appSharedStateActions.setCurrentAsset,
    (state, { asset, isLoading }): AppSharedState => ({
      ...state,
      currentAsset: asset === undefined ? state.currentAsset : asset,
      isLoadingAsset: isLoading ?? state.isLoadingAsset,
    })
  ),
  on(
    assetSearchActions.resetSearch,
    (state): AppSharedState => ({
      ...state,
      currentAsset: null,
    })
  ),
  on(
    appSharedStateActions.removeAssetFromSearch,
    (state, { assetId }): AppSharedState => ({
      ...state,
      currentAsset: state.currentAsset?.assetId === assetId ? null : state.currentAsset,
    })
  ),

  on(appSharedStateActions.updateAssetInSearch, (state, { asset }): AppSharedState => {
    const mapAsset = (it: AssetEditDetail): AssetEditDetail => (it.assetId === asset.assetId ? asset : it);
    return {
      ...state,
      currentAsset: state.currentAsset === null ? null : mapAsset(state.currentAsset),
    };
  }),
  on(
    appSharedStateActions.loadUserProfileResult,
    (state, rdUserProfile): AppSharedState => ({ ...state, rdUserProfile })
  ),
  on(
    appSharedStateActions.setAnonymousMode,
    (state): AppSharedState => ({
      ...state,
      isAnonymousMode: true,
    })
  ),
  on(
    appSharedStateActions.setTrackingConsent,
    (state, { hasConsented }): AppSharedState => ({
      ...state,
      hasConsentedToTracking: hasConsented,
    })
  ),
  on(
    appSharedStateActions.loadReferenceDataResult,
    (state, rdReferenceData): AppSharedState => ({ ...state, rdReferenceData })
  ),
  on(appSharedStateActions.loadWorkgroupsResult, (state, { workgroups }): AppSharedState => ({ ...state, workgroups })),
  on(appSharedStateActions.logout, (): AppSharedState => initialState),
  on(appSharedStateActions.setLang, (state, { lang }): AppSharedState => ({ ...state, lang })),
  on(
    appSharedStateActions.createContactResult,
    (state, contact): AppSharedState => ({
      ...state,
      rdReferenceData: pipe(
        RD.combine(state.rdReferenceData, contact),
        RD.map(([rd, contact]) =>
          RD.success({ ...rd, contacts: pipe(rd.contacts, R.upsertAt(String(contact.id), contact)) })
        ),
        RD.getOrElse(() => state.rdReferenceData)
      ),
    })
  ),
  on(
    appSharedStateActions.editContactResult,
    (state, contact): AppSharedState => ({
      ...state,
      rdReferenceData: pipe(
        RD.combine(state.rdReferenceData, contact),
        RD.map(([rd, contact]) =>
          RD.success({
            ...rd,
            contacts: pipe(
              rd.contacts,
              R.updateAt(String(contact.id), contact),
              O.getOrElse(() => rd.contacts)
            ),
          })
        ),
        RD.getOrElse(() => state.rdReferenceData)
      ),
    })
  )
);
