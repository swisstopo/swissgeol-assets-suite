import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import * as G from 'io-ts/Guard';

const bigintGuard: G.Guard<unknown, bigint> = {
  is: (u: unknown): u is bigint => typeof u === 'bigint',
};

export const bigint: D.Decoder<unknown, bigint> = D.fromGuard(bigintGuard, 'bigint');

export const numberFromBigint: D.Decoder<unknown, number> = pipe(
  D.fromGuard(bigintGuard, 'bigint'),
  D.parse((value) => E.right(Number(value))),
);
