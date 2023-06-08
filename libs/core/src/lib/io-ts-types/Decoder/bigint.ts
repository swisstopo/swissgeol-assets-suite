import * as D from 'io-ts/Decoder';
import * as G from 'io-ts/Guard';

const bigintGuard: G.Guard<unknown, bigint> = {
    is: (u: unknown): u is bigint => typeof u === 'bigint',
};

export const bigint: D.Decoder<unknown, bigint> = D.fromGuard(bigintGuard, 'bigint');
