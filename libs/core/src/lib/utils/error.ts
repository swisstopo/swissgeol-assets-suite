import * as D from 'io-ts/Decoder';

export const unknownToError = (e: unknown): Error =>
  typeof e === 'string' ? new Error(e) : e instanceof Error ? e : new Error('Unknown error');

export class TypedError<T extends string, C> extends Error {
  constructor(
    public readonly _tag: T,
    public readonly cause: C,
    message?: string,
  ) {
    super();
    if (message) {
      this.message = message;
    }
  }
}

export const unknownErrorTag = 'unknownError' as const;
const _unknownError = (e: Error) => new TypedError(unknownErrorTag, e);
export type UnknownError = ReturnType<typeof _unknownError>;
export const unknownError = _unknownError as (...args: Parameters<typeof _unknownError>) => UnknownError;
export const isUnknownError = (e: unknown): e is UnknownError => e instanceof TypedError && e._tag === unknownErrorTag;
export const unknownToUnknownError = (e: unknown): UnknownError => unknownError(unknownToError(e));

export const decodeErrorTag = 'decodeError' as const;
const _decodeError = (e: D.DecodeError) => new TypedError(decodeErrorTag, e, D.draw(e));
export type DecodeError = ReturnType<typeof _decodeError>;
export const decodeError = _decodeError as (...args: Parameters<typeof _decodeError>) => DecodeError;
export const isDecodeError = (e: unknown): e is DecodeError => e instanceof TypedError && e._tag === decodeErrorTag;
