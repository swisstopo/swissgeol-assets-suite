import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

export const DateFromISOString: D.Decoder<unknown, Date> = pipe(
  D.string,
  D.parse((s) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? D.failure(s, `cannot parse ${JSON.stringify(s)} to a Date`) : D.success(d);
  })
);
