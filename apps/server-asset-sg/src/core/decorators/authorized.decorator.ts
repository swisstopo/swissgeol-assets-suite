import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Policy } from '@/core/policy';
import { AuthorizedRequest } from '@/models/jwt-request';

export const Authorized = {
  Record: createParamDecorator((_param, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest() as AuthorizedRequest;
    return request.authorized?.record ?? null;
  }),
  Policy: createParamDecorator((_param, ctx: ExecutionContext): Policy<unknown> => {
    const request = ctx.switchToHttp().getRequest() as AuthorizedRequest;
    return request.authorized?.policy ?? null;
  }),
};
