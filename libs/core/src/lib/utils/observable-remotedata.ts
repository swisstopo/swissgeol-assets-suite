import * as RD from '@devexperts/remote-data-ts';
import { Observable, filter, of, map as rxMap } from 'rxjs';

export type ObservableRemoteData<E, A> = Observable<RD.RemoteData<E, A>>;

export const initial = of(RD.initial);

export const failure = <E = never, A = never>(e: E): ObservableRemoteData<E, A> => of(RD.failure(e));

export const success = <E = never, A = never>(a: A): ObservableRemoteData<E, A> => of(RD.success(a));

export const map: <A, B>(f: (a: A) => B) => <E>(fa: ObservableRemoteData<E, A>) => ObservableRemoteData<E, B> =
  (f) => (fa) =>
    fa.pipe(rxMap(RD.map(f)));

export const fromFilteredSuccess = <E, A>(source: Observable<RD.RemoteData<E, A>>): Observable<A> =>
  source.pipe(
    filter(RD.isSuccess),
    rxMap((a) => a.value),
  );
