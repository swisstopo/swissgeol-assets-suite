import * as D from 'io-ts/Decoder';
import * as G from 'io-ts/Guard';

export const dateGuard: G.Guard<unknown, Date> = {
  is: (u: unknown): u is Date => Object.prototype.toString.call(u) === '[object Date]',
};

export const date: D.Decoder<unknown, Date> = D.fromGuard(dateGuard, 'Date');
