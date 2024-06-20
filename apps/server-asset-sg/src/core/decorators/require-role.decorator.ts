import { Reflector } from '@nestjs/core';

import { Role } from '@/features/users/user.model';

/**
 * A decorator that guards NestJS routes by requiring an authenticated user
 * with a specific minimal access role to be present.
 *
 * @example```ts
 * @Post()
 * @RequireRole(Role.Editor)
 * async showRoute() {
 *   console.log('The current user is at least an editor.');
 * }
 * ```
 */
export const RequireRole = Reflector.createDecorator<Role>();
