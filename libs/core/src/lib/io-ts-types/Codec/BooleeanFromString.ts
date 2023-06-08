import * as C from 'io-ts/Codec';

import * as DT from '../Decoder';
import * as ET from '../Encoder';

export const BooleanFromString = C.make(DT.BooleanFromString, ET.BooleanFromString);
