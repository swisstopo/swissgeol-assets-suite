import * as O from 'fp-ts/Option';
import { Observable, filter, map as rxMap } from 'rxjs';

export type ObservableOption<A> = Observable<O.Option<A>>;

export const fromFilteredSome = <T>(source: Observable<O.Option<T>>): Observable<T> =>
  source.pipe(
    filter(O.isSome),
    rxMap((a) => a.value)
  );

export const map: <A, B>(f: (a: A) => B) => (fa: ObservableOption<A>) => ObservableOption<B> = (f) => (fa) =>
  fa.pipe(rxMap(O.map(f)));

export const chain =
  <A, B>(f: (a: A) => O.Option<B>) =>
  (fa: ObservableOption<A>): ObservableOption<B> =>
    fa.pipe(rxMap(O.chain(f)));
