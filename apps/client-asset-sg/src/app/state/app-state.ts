import { Store } from '@ngrx/store';

import { AppSharedState } from '@asset-sg/client-shared';

export interface AppState {
    shared: AppSharedState;
}

export interface AppStore extends Store<AppState> {}
