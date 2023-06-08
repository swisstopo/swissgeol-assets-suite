import * as D from 'io-ts/Decoder';

export const AuthErrorPayload = D.struct({
    code: D.number,
    msg: D.string,
});
export interface AuthErrorPayload extends D.TypeOf<typeof AuthErrorPayload> {}
