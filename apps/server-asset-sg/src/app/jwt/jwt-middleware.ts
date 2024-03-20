import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as jwt from 'jsonwebtoken';
import * as jkwToPem from 'jwk-to-pem';

import { AuthenticatedRequest } from '../models/request';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    async use(req: Request, _res: Response, next: NextFunction) {
        const token = this.extractTokenFromHeader(req);

        const decoded = jwt.decode(token!, { complete: true });
        console.log('decoded', decoded);

        const signingKey = {
            alg: 'RS256',
            e: 'AQAB',
            kid: '7v8YKx69eOSpHLdg9kvar1w4nCVJ6qgvMPmuDVWPwx0=',
            kty: 'RSA',
            n: 'xFUfYJKkTnjz0weuXARn1m-YWB7IOMOVit1IrbWZ7ZddofvotAwFKwqsqyVZ7Jqo0VF_CZVdHQeJ1uGBi5KQAZ2YydsbRjXTZ0sNFLkP0AOLCEsdH7ppdY65q7JxGGMnRif4nfsWoacDd1zmOP3nz6DDZo6xyBJvrgOrhEEEyTzSb4EJCYyU_va0knTe3bI7PLODzj8RlKmxgGFcboW5ZLy1Fy7fpURnT32GR36OQLwmNjrUsWHjT4tvCp1OuXGp_rk5VhckUh3r48POQ3-S63Qm-AiQTqCx8un7YOsoLmcsykC3KGIzHjW6q5ywZjq5fGwIXG-4LBMPsCVKKcDLwQ',
            use: 'sig',
        };

        const pem = jkwToPem(signingKey);

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
