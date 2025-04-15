import * as E from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { Observable, catchError, filter, of, map as rxMap, switchMap } from 'rxjs';

import { ObservableOption } from './observable-option';

export type ObservableEither<E, A> = Observable<E.Either<E, A>>;

export const left: <E = never, A = never>(e: E) => ObservableEither<E, A> = flow(E.left, of);

export const right: <E = never, A = never>(a: A) => ObservableEither<E, A> = flow(E.right, of);

export const map: <A, B>(f: (a: A) => B) => <E>(fa: ObservableEither<E, A>) => ObservableEither<E, B> = (f) => (fa) =>
  fa.pipe(rxMap(E.map(f)));

export const chainEither: <E, A, B>(
  f: (a: A) => E.Either<E, B>,
) => (fa: ObservableEither<E, A>) => ObservableEither<E, B> = (f) => (fa) => fa.pipe(rxMap(E.chain(f)));

export const chainEitherW: <A, E2, B>(
  f: (a: A) => E.Either<E2, B>,
) => <E>(fa: ObservableEither<E, A>) => ObservableEither<E | E2, B> = (f) => (fa) => fa.pipe(rxMap(E.chainW(f)));

export const mapLeft: <E, G>(f: (e: E) => G) => <A>(fa: ObservableEither<E, A>) => ObservableEither<G, A> = (f) =>
  rxMap(E.mapLeft(f));

export const catchErrorW: <E, E2, A>(
  f: (e: E) => E2,
) => <E1>(fa: ObservableEither<E1, A>) => ObservableEither<E1 | E2, A> = (f) => catchError((e) => left(f(e)));

export const chainSwitchMapW =
  <A, E2, B>(f: (a: A) => ObservableEither<E2, B>) =>
  <E1>(ma: ObservableEither<E1, A>): ObservableEither<E1 | E2, B> =>
    pipe(ma, switchMap(E.fold((a) => left<E1 | E2, B>(a), f)));

export const chainOfW =
  <A, E2, B>(f: (a: A) => E.Either<E2, B>) =>
  <E1>(ma: ObservableEither<E1, A>): ObservableEither<E1 | E2, B> =>
    ma.pipe(rxMap(E.fold((a) => E.left<E1 | E2, B>(a), f)));

export const alt = <E, A>(
  that: () => ObservableEither<E, A>,
): ((fa: ObservableEither<E, A>) => ObservableEither<E, A>) => switchMap(E.fold(that, right));

export const toOption: <A>(fa: ObservableEither<unknown, A>) => ObservableOption<A> = (fa) =>
  fa.pipe(rxMap(O.fromEither));

export const fromFilteredRight = <E, A>(source: Observable<E.Either<E, A>>): Observable<A> =>
  source.pipe(
    filter(E.isRight),
    rxMap((a) => a.right),
  );
