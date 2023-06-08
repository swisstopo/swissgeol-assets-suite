import * as C from 'io-ts/Codec';

import * as DT from '../Decoder';

export const JSONFromString = C.make(DT.JSONFromString, { encode: JSON.stringify });
