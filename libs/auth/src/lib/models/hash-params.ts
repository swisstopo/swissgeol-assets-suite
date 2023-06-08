import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import queryString from 'query-string';

export const passwordHashParams = (type: 'invite' | 'recovery') =>
    pipe(
        D.string,
        D.parse((hash: string) =>
            !hash || hash[0] !== '#' ? D.failure(hash, 'HashParams') : D.success(queryString.parse(hash.slice(1))),
        ),
        D.compose(
            D.union(
                pipe(
                    D.struct({
                        type: D.literal(type),
                        access_token: D.string,
                    }),
                    D.map(a => ({ ...a, hashParamsStatus: 'success' as const })),
                ),
                pipe(
                    D.struct({ error: D.literal('unauthorized_client'), error_code: D.literal('401') }),
                    D.map(a => ({ ...a, hashParamsStatus: 'failure' as const })),
                ),
            ),
        ),
    );

export type PasswordHashParams = D.TypeOf<ReturnType<typeof passwordHashParams>>;
