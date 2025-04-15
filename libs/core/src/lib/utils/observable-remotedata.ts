import * as RD from '@devexperts/remote-data-ts';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { Observable, filter, of, map as rxMap, switchMap } from 'rxjs';

import { ObservableEither } from './observable-either';
import { rdIsComplete } from './remote-data';

export type ObservableRemoteData<E, A> = Observable<RD.RemoteData<E, A>>;

export const initial = of(RD.initial);
export const initialL = () => initial;

export const pending = of(RD.pending);
export const pendingL = () => pending;

export const failure = <E = never, A = never>(e: E): ObservableRemoteData<E, A> => of(RD.failure(e));

export const success = <E = never, A = never>(a: A): ObservableRemoteData<E, A> => of(RD.success(a));

export const map: <A, B>(f: (a: A) => B) => <E>(fa: ObservableRemoteData<E, A>) => ObservableRemoteData<E, B> =
  (f) => (fa) =>
    fa.pipe(rxMap(RD.map(f)));

export const getOrElse: <A>(f: () => A) => <E>(fa: ObservableRemoteData<E, A>) => Observable<A> = (f) => (fa) =>
  fa.pipe(rxMap(RD.getOrElse(f)));

export const fromObservableEither: <E, A>(oea: ObservableEither<E, A>) => ObservableRemoteData<E, A> = (oe) =>
  oe.pipe(rxMap(RD.fromEither));

export const mapLeft: <E, E1>(f: (a: E) => E1) => <A>(fe: ObservableRemoteData<E, A>) => ObservableRemoteData<E1, A> =
  (f) => (fa) =>
    fa.pipe(rxMap(RD.mapLeft(f)));

export const chainSwitchMapW =
  <A, E2, B>(f: (a: A) => ObservableRemoteData<E2, B>) =>
  <E1>(ma: ObservableRemoteData<E1, A>): ObservableRemoteData<E1 | E2, B> =>
    pipe(ma, switchMap(RD.fold(initialL, pendingL, failure<E1 | E2, B>, f)));

export const altSwitchMap = <E2, A>(
  that: () => ObservableRemoteData<E2, A>,
): ((fa: ObservableRemoteData<unknown, A>) => ObservableRemoteData<E2, A>) =>
  switchMap(RD.fold(initialL, pendingL, that, success));

export const fromFilteredSuccess = <E, A>(source: Observable<RD.RemoteData<E, A>>): Observable<A> =>
  source.pipe(
    filter(RD.isSuccess),
    rxMap((a) => a.value),
  );

export const filterIsComplete = <E, A>(source: Observable<RD.RemoteData<E, A>>) => source.pipe(filter(rdIsComplete));

export const filterIsCompleteEither = <E, A>(source: Observable<RD.RemoteData<E, A>>): Observable<E.Either<E, A>> =>
  source.pipe(
    filter(rdIsComplete),
    rxMap((a) => {
      switch (a._tag) {
        case 'RemoteFailure':
          return E.left(a.error);
        case 'RemoteSuccess':
          return E.right(a.value);
      }
    }),
  );

export const toOption = <E, A>(source: Observable<RD.RemoteData<E, A>>): Observable<O.Option<A>> =>
  source.pipe(rxMap(RD.toOption));
