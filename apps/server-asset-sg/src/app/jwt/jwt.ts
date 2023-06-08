import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import * as R from 'fp-ts/ReadonlyRecord';
import * as D from 'io-ts/Decoder';
import * as jwt from 'jsonwebtoken';

export const jwtFromCookie = (cookieKey: string, jwtSecret: string) => (reqHeaderCookie: unknown) =>
    pipe(
        reqHeaderCookie,
        E.fromNullable('No cookie header' as const),
        E.chainW(
            flow(
                D.string.decode,
                E.chain(
                    flow(
                        a => a.split(';'),
                        A.map(c => c.trim().split('=')),
                        A.map(([k, v]) => [k, v] as const),
                        R.fromEntries,
                        E.of,
                        E.chainW(D.struct({ [cookieKey]: D.string }).decode),
                        E.map(a => a[cookieKey]),
                        E.bindTo('accessToken'),
                        E.bindW('jwtPayload', ({ accessToken }) => verifyJwt(jwtSecret)(accessToken)),
                    ),
                ),
            ),
        ),
    );

const verifyJwt = (jwtSecret: string) => (token: string) =>
    E.tryCatch<jwt.VerifyErrors, jwt.JwtPayload>(
        () => jwt.verify(token, jwtSecret) as jwt.JwtPayload,
        e => e as jwt.VerifyErrors,
    );
