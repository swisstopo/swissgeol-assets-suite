import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

export const BigIntFromString: D.Decoder<unknown, bigint> = pipe(
  D.string,
  D.parse((s) => {
    const n = BigInt(s);
    return typeof n !== 'bigint' || s.trim() === '' ? D.failure(s, `a bigint`) : D.success(n);
  })
);
