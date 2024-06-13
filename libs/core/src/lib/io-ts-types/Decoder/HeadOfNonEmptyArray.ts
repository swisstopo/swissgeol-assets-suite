import { pipe } from 'fp-ts/function';
import { head } from 'fp-ts/NonEmptyArray';
import * as D from 'io-ts/Decoder';

import { NonEmptyArray } from './NonEmptyArray';

export const HeadOfNonEmptyArray = <A>(decoder: D.Decoder<unknown, A>): D.Decoder<unknown, A> =>
  pipe(NonEmptyArray(decoder), D.map(head));
