import type { Option } from 'fp-ts/Option';
import * as C from 'io-ts/Codec';

import * as DT from '../Decoder';
import * as ET from '../Encoder';

export const optionFromNullable = <O, A>(codec: C.Codec<unknown, O, A>): C.Codec<unknown, O | null, Option<A>> => {
    return C.make(DT.optionFromNullable(codec), ET.optionFromNullable(codec));
};
