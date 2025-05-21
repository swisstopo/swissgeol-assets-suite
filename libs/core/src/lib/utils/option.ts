import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';

export const oGetOrElse = <T>(a: O.Option<T>, fallback: T) =>
  pipe(
    a,
    O.getOrElse(() => fallback),
  );

export const toBoolean = <T>(a: O.Option<T>) =>
  pipe(
    a,
    O.fold(
      () => false,
      () => true,
    ),
  );

export const toBooleanReverse = <T>(a: O.Option<T>) => !pipe(a, toBoolean);
