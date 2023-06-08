import * as E from 'fp-ts/Either';
import { identity, pipe } from 'fp-ts/function';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';
import { Equals, assert } from 'tsafe';

import { User, UserRole } from '@asset-sg/shared';

const PrismaUserRaw = D.struct({
    id: D.string,
    role: UserRole,
    user: D.struct({
        email: D.string,
        raw_user_meta_data: D.UnknownRecord,
    }),
});

const RawUserMetaDataDecoder = D.struct({ lang: D.string });
export const RawUserMetaData = C.make(RawUserMetaDataDecoder, { encode: identity });

export const PrismaUserDecoder = pipe(
    PrismaUserRaw,
    D.parse(u =>
        pipe(
            RawUserMetaDataDecoder.decode(u.user.raw_user_meta_data),
            E.map(rawUserMetaData => ({ id: u.id, role: u.role, email: u.user.email, lang: rawUserMetaData.lang })),
        ),
    ),
);

assert<Equals<D.TypeOf<typeof PrismaUserDecoder>, User>>();

export const PrismaUsersDecoder = D.array(PrismaUserDecoder);
