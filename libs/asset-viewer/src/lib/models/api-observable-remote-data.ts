import { ApiError } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';

import { SearchAssetResultEmptyError } from '../utils';

export type ApiObservableRemoteData<A> = ORD.ObservableRemoteData<ApiError, A>;

export type ObservableRemoteDataSearchAsset<A> = ORD.ObservableRemoteData<ApiError | SearchAssetResultEmptyError, A>;
