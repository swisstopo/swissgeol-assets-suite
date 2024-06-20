import { AppSharedState } from '@asset-sg/client-shared';
import { Store } from '@ngrx/store';

export interface AppState {
  shared: AppSharedState;
}

export type AppStore = Store<AppState>;
