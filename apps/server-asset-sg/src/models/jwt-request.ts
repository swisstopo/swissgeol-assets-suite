import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import { Policy } from '@/core/policy';
import { User } from '@/features/users/user.model';

export interface JwtRequest extends Request {
  user: User;
  accessToken: string;
  jwtPayload: jwt.JwtPayload;
}

export interface AuthorizedRequest extends Request {
  authorized: {
    record: object | null;
    policy: Policy<unknown>;
  };
}
