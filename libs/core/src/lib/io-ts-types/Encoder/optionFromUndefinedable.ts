import * as O from 'fp-ts/Option';
import * as E from 'io-ts/Encoder';

export const optionFromUndefinedable = <O, A>(encoder: E.Encoder<O, A>): E.Encoder<O | undefined, O.Option<A>> => ({
  encode: O.fold(() => undefined, encoder.encode),
});
