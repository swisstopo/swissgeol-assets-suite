import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { NonEmptyArray as _NonEmptyArray, fromArray } from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import * as D from 'io-ts/Decoder';

export const NonEmptyArray = <A>(decoder: D.Decoder<unknown, A>): D.Decoder<unknown, _NonEmptyArray<A>> =>
    pipe(
        D.UnknownArray,
        D.parse(a =>
            pipe(
                D.array(decoder).decode(a),
                E.chain(b => {
                    const nea = fromArray(b);
                    return O.isNone(nea) ? D.failure(b, 'empty array') : D.success(nea.value);
                }),
            ),
        ),
    );
