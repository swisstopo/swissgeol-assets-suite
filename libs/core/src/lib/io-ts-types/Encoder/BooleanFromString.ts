import * as E from 'io-ts/Encoder';

export const BooleanFromString: E.Encoder<string, boolean> = { encode: String };
