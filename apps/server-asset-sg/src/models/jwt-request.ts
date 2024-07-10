import { User } from '@shared/models/user';
import { Policy } from '@shared/policies/base/policy';
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
