import * as E from 'io-ts/Encoder';

export function undefinedable<O, A>(or: E.Encoder<O, A>): E.Encoder<undefined | O, undefined | A> {
    return {
        encode: a => (typeof a === 'undefined' ? undefined : or.encode(a)),
    };
}
