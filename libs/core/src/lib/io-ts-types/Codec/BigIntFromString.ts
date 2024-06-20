import * as C from 'io-ts/Codec';

import * as DT from '../Decoder';

export const BigIntFromString = C.make(DT.BigIntFromString, { encode: (n) => n.toString() });
