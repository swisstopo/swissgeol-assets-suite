import { SetMetadata } from '@nestjs/common';

export interface UserOnlyMetadata {
  action: 'user-only';
}

export interface AdminOnlyMetadata {
  action: 'admin-only';
}

export type AuthorizationMetadata = UserOnlyMetadata | AdminOnlyMetadata;

export const Authorize = {
  User: () => SetMetadata('authorization', { action: 'user-only' } as UserOnlyMetadata),
  Admin: () => SetMetadata('authorization', { action: 'admin-only' } as AdminOnlyMetadata),
};
