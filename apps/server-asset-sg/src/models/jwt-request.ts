import { Policy, User } from '@asset-sg/shared/v2';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

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
