import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import { User } from '@/features/users/user.model';

export interface JwtRequest extends Request {
    user: User;
    accessToken: string;
    jwtPayload: jwt.JwtPayload;
}
