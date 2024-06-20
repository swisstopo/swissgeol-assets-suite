import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { User } from '@/features/users/user.model';
import { JwtRequest } from '@/models/jwt-request';

/**
 * Extracts the currently authenticated user into a NestJS controller method.
 *
 * @example
 * show(@CurrentUser() user: User) {
 *   console.log(`The current user is ${user.email}.`);
 * }
 */
export const CurrentUser = createParamDecorator((data: keyof User, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest() as JwtRequest;
  const user = request.user;
  return data ? user?.[data] : user;
});
