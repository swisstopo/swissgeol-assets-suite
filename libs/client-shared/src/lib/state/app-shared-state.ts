import { Lang, ReferenceData, User } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';

import { ApiError } from '../utils';

export interface AppSharedState {
  rdUserProfile: RD.RemoteData<ApiError, User>;
  rdReferenceData: RD.RemoteData<ApiError, ReferenceData>;
  isPanelOpen: boolean;
  lang: Lang;
}

export interface AppState {
  shared: AppSharedState;
}
