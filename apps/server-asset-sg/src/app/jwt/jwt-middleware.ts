import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { assert } from 'tsafe';

import { isTruthy } from '@asset-sg/core';

import { AuthenticatedRequest } from '../models/request';

import { jwtFromCookie, jwtFromToken } from './jwt';

export const cookieKey = 'asset-sg-access-token';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    
    async use(req: Request, _res: Response, next: NextFunction) {
        const jwtSecret = process.env['GOTRUE_JWT_SECRET'];
        assert(isTruthy(jwtSecret), 'GOTRUE_JWT_SECRET is not defined');
        
        // TODO validate token
        //const result = pipe(req.headers.cookie, jwtFromCookie(cookieKey, jwtSecret));
        const token = this.extractTokenFromHeader(req);
        const decoded = jwtFromToken(token!, jwtSecret);
        const result = E.right({ accessToken: token!, jwtPayload: decoded!.payload as any});
      
        if (E.isRight(result)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (req as AuthenticatedRequest).accessToken = result.right.accessToken;
            (req as AuthenticatedRequest).jwtPayload = result.right.jwtPayload;
            next();
        } else {
            throw new HttpException('Unauthorised', 401);
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
      }
}
