import * as RD from '@devexperts/remote-data-ts';
import { Option } from 'fp-ts/Option';

export type RefreshableRemoteData<E, A, E1 = E, A1 = A> = [
    current: RD.RemoteData<E, A>,
    upcoming: Option<RD.RemoteData<E1, A1>>,
];

export const of = <E, A, E1 = E, A1 = A>(
    current: RD.RemoteData<E, A>,
    upcoming: Option<RD.RemoteData<E1, A1>>,
): RefreshableRemoteData<E, A, E1, A1> => [current, upcoming];
