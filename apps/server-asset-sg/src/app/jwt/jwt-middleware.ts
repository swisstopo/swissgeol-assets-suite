import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as jwt from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';

import { AuthenticatedRequest } from '../models/request';
import { HttpService } from '@nestjs/axios';
import { oAuthConfig } from '../../../../../configs/oauth.config';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(private httpService: HttpService) {}

    async use(req: Request, _res: Response, next: NextFunction) {
        const token = this.extractTokenFromHeader(req);

        const decoded = jwt.decode(token!, { complete: true });
        console.log('decoded', decoded);

        const response = await this.httpService.get(`${oAuthConfig.issuer}/.well-known/jwks.json`).toPromise();
        const jwks = response!.data.keys;
        const signingKey = jwks.find((key: any) => key.kid === decoded?.header.kid);
        const pem = jwkToPem(signingKey);

        const result = pipe(
            token,
            E.fromNullable(new Error('No token found')),
            E.chain(token => this.verifyToken(token, pem)),
        );

        if (E.isRight(result)) {
            (req as AuthenticatedRequest).accessToken = result.right.accessToken;
            (req as AuthenticatedRequest).jwtPayload = result.right.jwtPayload;
            next();
        } else {
            throw result.left;
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    private verifyToken(
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
