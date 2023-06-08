import { HttpErrorResponse } from '@angular/common/http';
import { ADTType, makeADT, ofType } from '@morphic-ts/adt';
import { Equals, assert } from 'tsafe';

import { DecodeError, TypedError, UnknownError, unknownToUnknownError } from '@asset-sg/core';

export const httpErrorResponseErrorTag = 'httpErrorResponseError' as const;
export const _httpErrorResponseError = (cause: HttpErrorResponse) => new TypedError(httpErrorResponseErrorTag, cause);
export interface HttpErrorResponseError extends ReturnType<typeof _httpErrorResponseError> {}
export const httpErrorResponseError = _httpErrorResponseError as (
    ...args: Parameters<typeof _httpErrorResponseError>
) => HttpErrorResponseError;
export const isHttpErrorResponseError = (e: unknown): e is HttpErrorResponseError =>
    e instanceof TypedError && e._tag === httpErrorResponseErrorTag;

export const httpErrorResponseOrUnknownError = (err: unknown) =>
    err instanceof HttpErrorResponse ? httpErrorResponseError(err) : unknownToUnknownError(err);

export const ApiError = makeADT('_tag')({
    httpErrorResponseError: ofType<HttpErrorResponseError>(),
    decodeError: ofType<DecodeError>(),
    unknownError: ofType<UnknownError>(),
});
export type ApiError = HttpErrorResponseError | DecodeError | UnknownError;
assert<Equals<ApiError, ADTType<typeof ApiError>>>();

export const formValidationErrorTag = 'formValidationError' as const;
const _formValidationError = () => new TypedError(formValidationErrorTag, null);
export interface FormValidationError extends ReturnType<typeof _formValidationError> {}
export const formValidationError = _formValidationError as () => FormValidationError;
