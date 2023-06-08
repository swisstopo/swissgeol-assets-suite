import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import isEmail from 'validator/lib/isEmail';

import { NonEmptyString } from './NonEmptyString';

export interface EmailBrand {
    readonly Email: unique symbol;
}

export type Email = string & EmailBrand;

export const Email = pipe(NonEmptyString, D.refine(isEmail as (s: string) => s is Email, 'Email'));
