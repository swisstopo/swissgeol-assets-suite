import { ReferenceDataMapping } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { getRouterSelectors } from '@ngrx/router-store';
import { createSelector } from '@ngrx/store';

import { AppState } from './app-shared-state';

const appSharedFeature = (state: AppState) => state.shared;

export const selectReferenceData = createSelector(appSharedFeature, (state) => state.referenceData);

export const selectIsAnonymousMode = createSelector(appSharedFeature, (state) => state.isAnonymousMode);

export const selectHasConsentedToTracking = createSelector(appSharedFeature, (state) => state.hasConsentedToTracking);

export const selectRDUserProfile = createSelector(appSharedFeature, (state) => state.rdUserProfile);

export const selectUser = createSelector(selectRDUserProfile, RD.toNullable);

export const selectCurrentAsset = createSelector(appSharedFeature, (state) => state.currentAsset?.asset ?? null);
export const selectCurrentAssetAndGeometries = createSelector(appSharedFeature, (state) => state.currentAsset);
export const selectHasCurrentAsset = createSelector(
  appSharedFeature,
  (state) => state.currentAsset !== null || state.isLoadingAsset,
);

export const selectWorkgroups = createSelector(appSharedFeature, (state) => state.workgroups);

const createReferenceDataSelector = <T>(extract: (rd: ReferenceDataMapping) => T) =>
  createSelector(selectReferenceData, (referenceData) => {
    if (referenceData == null) {
      return null;
    }
    return extract(referenceData);
  });

export const selectReferenceLanguages = createReferenceDataSelector((rd) => rd.languages);

export const selectReferenceAssetFormats = createReferenceDataSelector((rd) => rd.assetFormats);

export const selectReferenceAssetTopics = createReferenceDataSelector((rd) => rd.assetTopics);

export const selectReferenceAssetKinds = createReferenceDataSelector((rd) => rd.assetKinds);

export const selectReferenceNationalInterestTypes = createReferenceDataSelector((rd) => rd.nationalInterestTypes);

export const selectReferenceContacts = createReferenceDataSelector((rd) => rd.contacts);

export const selectReferenceContactKinds = createReferenceDataSelector((rd) => rd.contactKinds);

export const selectReferenceLegalDocCodes = createReferenceDataSelector((rd) => rd.legalDocs);

export const selectLocale = createSelector(appSharedFeature, (state) => (state.lang === 'en' ? 'en-GB' : 'de-CH'));

export const {
  selectCurrentRoute, // select the current route
  selectFragment, // select the current route fragment
  selectQueryParams, // select the current route query params
  selectQueryParam, // factory function to select a query param
  selectRouteParams, // select the current route params
  selectRouteParam, // factory function to select a route param
  selectRouteData, // select the current route data
  selectRouteDataParam, // factory function to select a route data param
  selectUrl, // select the current url
  selectTitle, // select the title if available
} = getRouterSelectors();
