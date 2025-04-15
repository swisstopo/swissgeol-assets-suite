import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

export const JSONFromString = pipe(
  D.string,
  D.parse((s) => {
    try {
      return D.success(JSON.parse(s));
    } catch (e) {
      return D.failure(s, 'JSON. ' + String(e));
    }
  }),
);
