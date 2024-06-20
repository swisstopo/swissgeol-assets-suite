import { pipe } from 'fp-ts/function';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

import { JSONFromString } from './json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Buffer: any;

const _atob = typeof window !== 'undefined' ? atob : (str: string) => Buffer.from(str, 'base64').toString('binary');
const _btoa = typeof window !== 'undefined' ? btoa : (str: string) => Buffer.from(str, 'binary').toString('binary');

const StringFromBase64Decoder = pipe(
  D.string,
  D.parse((s) => {
    try {
      return D.success(_atob(s));
    } catch (e) {
      return D.failure(s, 'Base64. ' + String(e));
    }
  })
);

export const StringFromBase64 = C.make(StringFromBase64Decoder, {
  encode: (s) => _btoa(s),
});

export const JSONFromBase64 = pipe(StringFromBase64, C.compose(JSONFromString));
