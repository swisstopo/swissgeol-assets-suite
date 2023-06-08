import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as D from 'io-ts/Decoder';

import { undefinedable } from './undefinedable';

export const fromUndefinedable = <A>(a: A): O.Option<NonNullable<A>> =>
    typeof a === 'undefined' ? O.none : O.some(a as NonNullable<A>);

export const optionFromUndefinedable = <A>(decoder: D.Decoder<unknown, A>): D.Decoder<unknown, O.Option<A>> =>
    pipe(undefinedable(decoder), D.map(fromUndefinedable));
