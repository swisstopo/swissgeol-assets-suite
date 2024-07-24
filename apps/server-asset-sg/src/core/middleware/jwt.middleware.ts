import { User } from '@asset-sg/shared/v2';
import { environment } from '@environment';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import axios from 'axios';
import { Cache } from 'cache-manager';
import { NextFunction, Request, Response } from 'express';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as jwt from 'jsonwebtoken';
import { Jwt, JwtPayload } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

import { UserRepo } from '@/features/users/user.repo';
import { JwtRequest } from '@/models/jwt-request';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, private readonly userRepo: UserRepo) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'development') {
      const authentication = req.header('Authorization');
      if (authentication != null && authentication.startsWith('Impersonate ')) {
        const email = authentication.split(' ', 2)[1];
        const user = await this.userRepo.findByEmail(email);
        if (user == null) {
          res.status(401).json({ error: `no user with email '${email}' found` });
          return;
        }
        const payload: JwtPayload = { sub: user.id, username: `???_${user.email}` };
        await this.initializeRequest(req, 'impersonated-access-token', payload);
        return next();
      }
    }

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
      E.chain((decoded) =>
        pipe(
          jwk,
          E.chain((jwk) => this.getSigningKeyE(decoded, jwk))
        )
      ),
      this.jwkToPemE,
      E.chain((pem) => this.verifyToken(token, pem))
    );

    // Set accessToken and jwtPayload to request if verification is successful
    if (E.isRight(result)) {
      await this.initializeRequest(req, result.right.accessToken, result.right.jwtPayload as JwtPayload);
      next();
    } else {
      res.status(403).json({ error: 'not authorized by eIAM' });
    }
  }

  private getJwkFromCache(): TE.TaskEither<Error, JwksKey[]> {
    return pipe(
      TE.tryCatch(
        () => this.cacheManager.get('jwk'),
        (reason) => new Error(`${reason}`)
      ),
      TE.chain((cache) => (cache ? TE.right(cache as JwksKey[]) : TE.left(new Error('No cache found'))))
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
          () => new Error('Invalid token type')
        )
      )
    );
  }

  private decodeTokenE(token: string): E.Either<Error, Jwt> {
    return pipe(
      E.tryCatch(() => jwt.decode(token, { complete: true }), E.toError),
      E.chain((decoded) => (decoded !== null ? E.right(decoded) : E.left(new Error('Token decoding resulted in null'))))
    );
  }

  private isAuthorizedByGroupE(jwt: Jwt): E.Either<Error, Jwt> {
    const authorizedGroups = process.env.OAUTH_AUTHORIZED_GROUPS?.split(',').map((group) => group.trim().toLowerCase());
    if (!authorizedGroups) {
      return E.left(new Error('An internal server error occurred. Please try again.'));
    }
    const userGroups = (jwt.payload as JwtPayload)['cognito:groups'].map((group: string) =>
      group.trim().toLowerCase()
    ) as string[];
    const isUserAuthorized = userGroups.some((group) => authorizedGroups.includes(group));
    return isUserAuthorized ? E.right(jwt) : E.left(new Error('You are not authorized to access this resource'));
  }

  private getJwkTE(): TE.TaskEither<Error, JwksKey[]> {
    const jwksPath = environment.production ? '/.well-known/jwks.json' : '/.well-known/openid-configuration/jwks';
    return pipe(
      TE.tryCatch(
        () => axios.get(`${process.env.OAUTH_ISSUER}${jwksPath}`),
        (reason) => new Error(`${reason}`)
      ),
      TE.map((response) => response.data.keys)
    );
  }

  private getSigningKeyE(decoded: Jwt, jwks: JwksKey[]): E.Either<Error, JwksKey> {
    return pipe(
      jwks.find((key) => key.kid === decoded.header.kid),
      (signingKey) => (signingKey ? E.right(signingKey) : E.left(new Error('Matching object not found')))
    );
  }

  private jwkToPemE(signingKey: E.Either<Error, object>): E.Either<Error, string> {
    return pipe(
      signingKey,
      E.chain((signingKeyObject) =>
        E.tryCatch(
          () => jwkToPem(signingKeyObject as jwkToPem.JWK), // Attempt to convert JWK to PEM
          (error) => new Error(`Failed to convert JWK to PEM: ${error}`) // Catch and wrap any errors
        )
      )
    );
  }

  private verifyToken(
    token: E.Either<Error, string>,
    pem: string
  ): E.Either<
    Error,
    {
      accessToken: string;
      jwtPayload: JwtPayload;
    }
  > {
    return pipe(
      token,
      E.chain((tokenString) =>
        pipe(
          E.tryCatch(
            () => jwt.verify(tokenString, pem, { algorithms: ['RS256'] }),
            (err: unknown) => new Error(`Invalid token: ${(err as Error).message}`)
          ),
          E.map((verified) => {
            if (typeof verified === 'string') {
              throw new HttpException('invalid JWT payload: unable to decode', 401);
            }
            return { accessToken: tokenString, jwtPayload: verified };
          })
        )
      )
    );
  }

  private async initializeRequest(req: Request, accessToken: string, payload: JwtPayload): Promise<void> {
    const oidcId = payload.sub;
    if (oidcId == null || oidcId.length === 0) {
      throw new HttpException('invalid JWT payload: missing sub', 401);
    }

    // Load the JWT's user, or create it if it does not exist yet.
    const user = (await this.userRepo.find(oidcId)) ?? (await this.initializeDefaultUser(oidcId, payload));

    // Extend the request with the fields required to make it an `AuthenticatedRequest`.
    const authenticatedFields: Omit<JwtRequest, keyof Request> = {
      user,
      accessToken,
      jwtPayload: payload,
    };
    Object.assign(req, authenticatedFields);
  }

  private async initializeDefaultUser(oidcId: string, payload: JwtPayload): Promise<User> {
    if (!('username' in payload) || payload.username.length === 0) {
      throw new HttpException('invalid JWT payload: missing username', 401);
    }
    const email = payload.username.split('_')[1];
    if (email == null || !/^.+@.+\..+$/.test(email)) {
      throw new HttpException('invalid JWT payload: username does not contain an email', 401);
    }
    return await this.userRepo.create({
      oidcId,
      email,
      lang: 'de',
      isAdmin: false,
      roles: new Map(),
    });
  }
}

interface JwksKey {
  kid: string | undefined;
}
