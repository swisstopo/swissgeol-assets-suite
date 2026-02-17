import { Policy, User } from '@asset-sg/shared/v2';
import { Request } from 'express';

export interface JwtRequest extends Request {
  user: User;
}

export interface AuthorizedRequest extends Request {
  authorized: {
    record: object | null;
    policy: Policy<unknown>;
  };
}
