import * as C from 'io-ts/Codec';

import * as DT from '../Decoder';
import * as ET from '../Encoder';

export const optionFromUndefinedable = <O, A>(codec: C.Codec<unknown, O, A>) => {
    return C.make(DT.optionFromUndefinedable(codec), ET.optionFromUndefinedable(codec));
};
