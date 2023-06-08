import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    accessToken: string;
    jwtPayload: jwt.JwtPayload;
}
