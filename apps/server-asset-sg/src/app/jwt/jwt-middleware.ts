import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import * as jwt from 'jsonwebtoken';
import { Jwt, JwtPayload } from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import axios from 'axios';
import { AuthenticatedRequest } from '../models/request';
import { HttpService } from '@nestjs/axios';
import { oAuthConfig } from '../../../../../configs/oauth.config';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(private httpService: HttpService) {}

    async use(req: Request, _res: Response, next: NextFunction) {
        const token = this.extractTokenFromHeaderE(req);
        const decoded = this.decodeTokenE(token);
        const jwks = await this.getJwkTE()();
        const signingKey = this.getSigningKeyE(decoded, jwks);
        const pem = this.jwkToPemTE(signingKey);
        const result = this.verifyToken2(token, pem as unknown as string);

        // const token = this.extractTokenFromHeader(req);
        //
        // const decoded = jwt.decode(token!, { complete: true });
        // console.log('decoded', decoded);
        //
        // const response = await this.httpService.get(`${oAuthConfig.issuer}/.well-known/jwks.json`).toPromise();
        // const jwks = response!.data.keys;
        // const signingKey = jwks.find((key: any) => key.kid === decoded?.header.kid);
        // const pem = jwkToPem(signingKey);
        // console.log('pem', pem);
        //
        // const result = pipe(
        //     token,
        //     E.fromNullable(new Error('No token found')),
        //     E.chain(token => this.verifyTokenOld(token, pem)),
        // );
        //

        if (E.isRight(result)) {
            (req as AuthenticatedRequest).accessToken = result.right.accessToken;
            (req as AuthenticatedRequest).jwtPayload = result.right.jwtPayload as JwtPayload;
            next();
        } else {
            throw result.left;
        }
    }

    private extractTokenFromHeaderE(request: Request): E.Either<Error, string> {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return pipe(
            token,
            E.fromNullable(new Error('No token found')),
            E.chain(
                E.fromPredicate(
                    () => type === 'Bearer',
                    () => new Error('Invalid token type'),
                ),
            ),
        );
    }

    private decodeTokenE(token: E.Either<Error, string>): E.Either<Error, Jwt> {
        return pipe(
            token,
            E.chain(tokenString =>
                pipe(
                    E.tryCatch(() => jwt.decode(tokenString, { complete: true }), E.toError),
                    E.chain(decoded =>
                        decoded !== null ? E.right(decoded) : E.left(new Error('Token decoding resulted in null')),
                    ),
                ),
            ),
        );
    }

    private decodeToken(token: string): E.Either<Error, Jwt> {
        return pipe(
            E.tryCatch(() => jwt.decode(token, { complete: true }), E.toError),
            E.chain(decoded =>
                decoded !== null ? E.right(decoded) : E.left(new Error('Token decoding resulted in null')),
            ),
        );
    }

    private getJwkTE(): TE.TaskEither<Error, object[]> {
        return pipe(
            TE.tryCatch(
                () => axios.get(`${oAuthConfig.issuer}/.well-known/jwks.json`),
                reason => new Error(`${reason}`),
            ),
            TE.map(response => response.data.keys),
        );
    }

    private getSigningKeyTE(
        decoded: E.Either<Error, Jwt>,
        jwks: TE.TaskEither<Error, object[]>,
    ): TE.TaskEither<Error, object> {
        return pipe(
            decoded,
            TE.fromEither, // Convert decoded from Either to TaskEither
            TE.chain(decodedJwt =>
                pipe(
                    jwks,
                    TE.map(jwks =>
                        E.fromNullable(new Error('Key not found'))(
                            // Handle the case where no key is found
                            jwks.find((key: any) => key.kid === decodedJwt.header.kid),
                        ),
                    ),
                    TE.chain(TE.fromEither), // Lift the Either<Error, JwksKey> into TaskEither<Error, JwksKey>
                ),
            ),
        );
    }

    private getSigningKeyE(
        decodedE: E.Either<Error, Jwt>,
        jwksE: E.Either<Error, JwksKey[]>,
    ): E.Either<Error, JwksKey> {
        return pipe(
            decodedE,
            E.chain(decoded =>
                pipe(
                    jwksE,
                    E.chain(jwks =>
                        pipe(
                            jwks.find((key: any) => key.kid === decoded.header.kid),
                            signingKey =>
                                signingKey ? E.right(signingKey) : E.left(new Error('Matching object not found')),
                        ),
                    ),
                ),
            ),
        );
    }

    private jwkToPemTE(signingKey: E.Either<Error, object>): E.Either<Error, string> {
        return pipe(
            signingKey,
            E.chain(signingKeyString => jwkToPem(signingKeyString)),
        );
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    private verifyToken(
        token: E.Either<Error, string>,
        pem: E.Either<Error, string>,
    ): E.Either<
        Error,
        {
            accessToken: string;
            jwtPayload: string | JwtPayload;
        }
    > {
        return pipe(
            token,
            E.chain(token =>
                pipe(
                    pem,
                    E.map(pemString => {
                        console.log('pemString', E.isRight(pem));
                        return jwt.verify(token, pem, { algorithms: ['RS256'] });
                    }),
                    E.map(verified => ({ accessToken: token, jwtPayload: verified })),
                ),
            ),
        );
    }

    private verifyToken2(
        token: E.Either<Error, string>,
        pem: string,
    ): E.Either<
        Error,
        {
            accessToken: string;
            jwtPayload: string | JwtPayload;
        }
    > {
        return pipe(
            token,
            E.chain(tokenString =>
                pipe(
                    E.tryCatch(
                        () => jwt.verify(tokenString, pem, { algorithms: ['RS256'] }),
                        (err: unknown) => new Error(`Invalid token: ${(err as Error).message}`),
                    ),
                    E.map(verified => ({ accessToken: tokenString, jwtPayload: verified })),
                ),
            ),
        );
    }

    private verifyTokenOld(
        token: string,
        secret: string,
    ): E.Either<
        Error,
        {
            accessToken: string;
            jwtPayload: any;
        }
    > {
        return pipe(
            E.tryCatch(
                () => jwt.verify(token, secret, { algorithms: ['RS256'] }),
                (err: unknown) => new Error(`Invalid token: ${(err as Error).message}`),
            ),
            E.map(decoded => ({ accessToken: token, jwtPayload: decoded })),
        );
    }
}

interface JwksKey {}
