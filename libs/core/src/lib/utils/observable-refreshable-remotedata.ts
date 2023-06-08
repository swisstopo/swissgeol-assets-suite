import { Observable } from 'rxjs';

import { RefreshableRemoteData } from './refreshable-remotedata';

export type ObservableRefreshableRemoteData<E, A> = Observable<RefreshableRemoteData<E, A>>;
