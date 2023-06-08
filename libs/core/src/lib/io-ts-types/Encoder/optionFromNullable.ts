import * as O from 'fp-ts/Option';
import * as E from 'io-ts/Encoder';

export const optionFromNullable = <O, A>(encoder: E.Encoder<O, A>): E.Encoder<O | null, O.Option<A>> => ({
    encode: O.fold(() => null, encoder.encode),
});
