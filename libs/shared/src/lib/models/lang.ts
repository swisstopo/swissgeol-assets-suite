import * as E from 'fp-ts/Either';
import { constFalse } from 'fp-ts/function';
import { Eq as EqString } from 'fp-ts/string';
import * as D from 'io-ts/Decoder';

export const Lang = D.union(D.literal('de'), D.literal('en'), D.literal('fr'), D.literal('it'), D.literal('rm'));
export type Lang = D.TypeOf<typeof Lang>;

export const eqLangRight = E.getEq({ equals: constFalse }, EqString);
