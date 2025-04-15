import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

export const undefinedable = <I, A>(or: D.Decoder<I, A>): D.Decoder<undefined | I, undefined | A> => ({
  decode: (i) =>
    typeof i === 'undefined'
      ? E.of<never, undefined | A>(undefined)
      : pipe(
          or.decode(i),
          E.bimap(
            () => D.error(i, 'undefined'),
            (a): A | undefined => a,
          ),
        ),
});
