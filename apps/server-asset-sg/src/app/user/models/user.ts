import * as D from 'io-ts/Decoder';
import { Equals, assert } from 'tsafe';

import { User, UserRole } from '@asset-sg/shared';

const PrismaUserRaw = D.struct({
    id: D.string,
    role: UserRole,
  email: D.string,
  lang: D.string,

});

export const PrismaUserDecoder = PrismaUserRaw

assert<Equals<D.TypeOf<typeof PrismaUserDecoder>, User>>();

export const PrismaUsersDecoder = D.array(PrismaUserDecoder);
