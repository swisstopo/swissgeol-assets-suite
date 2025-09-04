import { Asset, GeometryDetail, ReferenceDataMapping, SimpleWorkgroup, User } from '@asset-sg/shared/v2';

export interface AppSharedState {
  user: User | null;
  referenceData: ReferenceDataMapping | null;
  workgroups: SimpleWorkgroup[];
  isAnonymousMode: boolean | null;
  hasConsentedToTracking: boolean;
  currentAsset: CurrentAsset | null;
  isLoadingAsset: boolean;
}

export interface CurrentAsset {
  asset: Asset;
  geometries: GeometryDetail[];
}

export interface AppState {
  shared: AppSharedState;
}
