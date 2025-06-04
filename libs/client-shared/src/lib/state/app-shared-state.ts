import { Lang } from '@asset-sg/shared';
import { Asset, GeometryDetail, ReferenceDataMapping, SimpleWorkgroup, User } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';

import { ApiError } from '../utils';

export interface AppSharedState {
  rdUserProfile: RD.RemoteData<ApiError, User>;
  referenceData: ReferenceDataMapping | null;
  workgroups: SimpleWorkgroup[];
  lang: Lang;
  isAnonymousMode: boolean;
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
