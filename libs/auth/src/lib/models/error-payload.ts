import * as D from 'io-ts/Decoder';

export const AuthErrorPayload = D.struct({
  code: D.number,
  msg: D.string,
});
export type AuthErrorPayload = D.TypeOf<typeof AuthErrorPayload>;
