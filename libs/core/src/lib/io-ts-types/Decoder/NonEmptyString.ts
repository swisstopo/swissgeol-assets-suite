import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

export interface NonEmptyStringBrand {
  readonly NonEmptyString: unique symbol;
}

export type NonEmptyString = string & NonEmptyStringBrand;

export const NonEmptyString = pipe(
  D.string,
  D.refine((s): s is NonEmptyString => s !== '', 'NonEmptyString')
);
