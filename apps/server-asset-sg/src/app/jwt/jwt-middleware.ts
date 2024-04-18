import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import axios from 'axios';
import { Cache } from 'cache-manager';
import { NextFunction, Request, Response } from 'express';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as jwt from 'jsonwebtoken';
import { Jwt, JwtPayload } from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';

import { AuthenticatedRequest } from '../models/request';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async use(req: Request, _res: Response, next: NextFunction) {
        // Get JWK from cache if exists, otherwise fetch from issuer and set to cache for 1 minute
        const cachedJwk = await this.getJwkFromCache()();
        const jwk = E.isRight(cachedJwk) ? cachedJwk : await this.getJwkTE()();
        await this.cacheManager.set('jwk', E.isRight(jwk) ? jwk.right : [], 60 * 1000);

        const token = this.extractTokenFromHeaderE(req);
        // Decode token, check groups permission, get JWK, convert JWK to PEM, and verify token
        const result = pipe(
            token,
            E.chain(this.decodeTokenE),
            E.chain(this.isAuthorizedByGroupE),
            E.chain(decoded =>
                pipe(
                    jwk,
                    E.chain(jwk => this.getSigningKeyE(decoded, jwk)),
                ),
            ),
            this.jwkToPemE,
            E.chain(pem => this.verifyToken(token, pem)),
        );

        // Set accessToken and jwtPayload to request if verification is successful
        if (E.isRight(result)) {
            (req as AuthenticatedRequest).accessToken = result.right.accessToken;
            (req as AuthenticatedRequest).jwtPayload = result.right.jwtPayload as JwtPayload;
            next();
        } else {
          _res.status(500).json({ error: result.left.message });
        }
    }

    private getJwkFromCache(): TE.TaskEither<Error, JwksKey[]> {
        return pipe(
            TE.tryCatch(
                () => this.cacheManager.get('jwk'),
                reason => new Error(`${reason}`),
            ),
            TE.chain(cache => (cache ? TE.right(cache as JwksKey[]) : TE.left(new Error('No cache found')))),
        );
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

    private decodeTokenE(token: string): E.Either<Error, Jwt> {
        return pipe(
            E.tryCatch(() => jwt.decode(token, { complete: true }), E.toError),
            E.chain(decoded =>
                decoded !== null ? E.right(decoded) : E.left(new Error('Token decoding resulted in null')),
            ),
        );
    }

  private isAuthorizedByGroupE(jwt: Jwt): E.Either<Error, Jwt> {
      const authorizedGroups = process.env.OAUTH_AUTHORIZED_GROUPS?.split(',');
      if (!authorizedGroups) {
        return E.left(new Error('An internal server error occurred. Please try again.'));
      }
      const userGroups = (jwt.payload as JwtPayload)['cognito:groups'] as string[];
      const isUserAuthorized = userGroups.some(group => authorizedGroups.includes(group));
      return isUserAuthorized ? E.right(jwt) : E.left(new Error('You are not authorized to access this resource'));
  }

    private getJwkTE(): TE.TaskEither<Error, JwksKey[]> {
        return pipe(
            TE.tryCatch(
                () => axios.get(`${process.env.OAUTH_ISSUER}/.well-known/jwks.json`),
                reason => new Error(`${reason}`),
            ),
            TE.map(response => response.data.keys),
        );
    }



    private getSigningKeyE(decoded: Jwt, jwks: JwksKey[]): E.Either<Error, JwksKey> {
        return pipe(
            jwks.find((key: any) => key.kid === decoded.header.kid),
            signingKey => (signingKey ? E.right(signingKey) : E.left(new Error('Matching object not found'))),
        );
    }

    private jwkToPemE(signingKey: E.Either<Error, object>): E.Either<Error, string> {
        return pipe(
            signingKey,
            E.chain(signingKeyObject =>
                E.tryCatch(
                    () => jwkToPem(signingKeyObject as jwkToPem.JWK), // Attempt to convert JWK to PEM
                    error => new Error(`Failed to convert JWK to PEM: ${error}`), // Catch and wrap any errors
                ),
            ),
        );
    }

    private verifyToken(
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
}

interface JwksKey {} // TODO implement JwksKey interface
