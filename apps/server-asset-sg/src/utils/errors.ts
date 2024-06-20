import { TypedError } from '@asset-sg/core';

export const notFoundErrorTag = 'notFound';
const _notFoundError = () => new TypedError(notFoundErrorTag, null);
export type NotFoundError = ReturnType<typeof _notFoundError>;
export const notFoundError = _notFoundError as (...args: Parameters<typeof _notFoundError>) => NotFoundError;
export const isNotFoundError = (e: unknown): e is NotFoundError =>
  e instanceof TypedError && e._tag === notFoundErrorTag;

export const permissionDeniedErrorTag = 'permissionDenied';
const _permissionDeniedError = (reason: string) => new TypedError(permissionDeniedErrorTag, reason);
export type PermissionDeniedError = ReturnType<typeof _permissionDeniedError>;
export const permissionDeniedError = _permissionDeniedError as (
  ...args: Parameters<typeof _permissionDeniedError>
) => PermissionDeniedError;
