import { TypedError } from '@asset-sg/core';

export const searchAssetResultEmptyErrorTag = 'searchAssetResultEmptyError' as const;
const _searchAssetResultEmptyError = () => new TypedError(searchAssetResultEmptyErrorTag, null);
export interface SearchAssetResultEmptyError extends ReturnType<typeof _searchAssetResultEmptyError> {}
export const searchAssetResultEmptyError = _searchAssetResultEmptyError as () => SearchAssetResultEmptyError;
