import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

export const NumberFromString: D.Decoder<unknown, number> = pipe(
  D.string,
  D.parse((s) => {
    const n = Number(s);
    return isNaN(n) || s.trim() === '' ? D.failure(s, `a number`) : D.success(n);
  })
);
