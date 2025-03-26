import { Lang, ReferenceData } from '@asset-sg/shared';
import { SimpleWorkgroup, User } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';

import { ApiError } from '../utils';

export interface AppSharedState {
  rdUserProfile: RD.RemoteData<ApiError, User>;
  rdReferenceData: RD.RemoteData<ApiError, ReferenceData>;
  workgroups: SimpleWorkgroup[];
  lang: Lang;
  isAnonymousMode: boolean;
  hasConsentedToTracking: boolean;
}

export interface AppState {
  shared: AppSharedState;
}
