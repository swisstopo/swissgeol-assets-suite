import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

export const BooleanFromString: D.Decoder<unknown, boolean> = pipe(
  D.string,
  D.parse((n) => (n !== 'true' && n !== 'false' ? D.failure(n, `a boolean`) : D.success(n === 'true')))
);
