import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import { Observable, of, map as rxMap } from 'rxjs';

export type ObservableEither<E, A> = Observable<E.Either<E, A>>;

export const left: <E = never, A = never>(e: E) => ObservableEither<E, A> = flow(E.left, of);

export const right: <E = never, A = never>(a: A) => ObservableEither<E, A> = flow(E.right, of);

export const map: <A, B>(f: (a: A) => B) => <E>(fa: ObservableEither<E, A>) => ObservableEither<E, B> = (f) => (fa) =>
  fa.pipe(rxMap(E.map(f)));
