import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

import { DecodeError, decodeError } from './error';

export const decode =
    <I, A>(decoder: D.Decoder<I, A>) =>
    (value: I): E.Either<DecodeError, A> =>
        pipe(decoder.decode(value), E.mapLeft(decodeError));
