import * as C from 'io-ts/Codec';

import * as DT from '../Decoder';

export const Email = C.fromDecoder(DT.Email);
