import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

import { NumberFromString } from './NumberFromString';

export const IntFromString: D.Decoder<unknown, number> = pipe(
  NumberFromString,
  D.parse((n) => (!Number.isInteger(n) ? D.failure(n, `an integer`) : D.success(n)))
);
