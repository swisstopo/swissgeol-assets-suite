import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as D from 'io-ts/Decoder';

import { date } from './date';

export const optionFromNullable = <A>(decoder: D.Decoder<unknown, A>): D.Decoder<unknown, O.Option<A>> =>
  pipe(D.nullable(decoder), D.map(O.fromNullable));

export const optionFromNullableNonEmptyString: D.Decoder<unknown, O.Option<string>> = pipe(
  D.nullable(D.string),
  D.map((a) => (a === '' ? null : a)),
  D.map(O.fromNullable)
);

export const optionFromNullableDate: D.Decoder<unknown, O.Option<Date>> = pipe(D.nullable(date), D.map(O.fromNullable));
