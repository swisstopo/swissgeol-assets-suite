import * as E from 'fp-ts/Either';
import * as jwt from 'jsonwebtoken';

export const jwtFromToken = (token: string, jwtSecret: string) => {
    const decoded = jwt.decode(token, { complete: true });
    console.log('decoded', decoded);
    if (decoded?.payload) {
        console.log('verify', jwt.verify(token, jwtSecret, { algorithms: ['HS256'], complete: true }));
    }
    return decoded;
};

const verifyJwt = (jwtSecret: string) => (token: string) =>
    E.tryCatch<jwt.VerifyErrors, jwt.JwtPayload>(
        () => jwt.verify(token, jwtSecret) as jwt.JwtPayload,
        e => e as jwt.VerifyErrors,
    );
