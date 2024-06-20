import * as C from 'io-ts/Codec';
import * as E from 'io-ts/Encoder';

import * as DT from '../Decoder';

const encoder: E.Encoder<string, Date> = {
  encode: (d) => d.toISOString(),
};

export const DateFromISOString = C.make(DT.DateFromISOString, encoder);
