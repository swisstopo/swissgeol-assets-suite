import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

import { NonEmptyString } from './NonEmptyString';

export interface EmailBrand {
  readonly Email: unique symbol;
}

export type Email = string & EmailBrand;

const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
const isEmail = (email: string): email is Email => emailRegex.test(email);
export const Email = pipe(NonEmptyString, D.refine(isEmail, 'Email'));
