import * as E from 'fp-ts/Either';

export type GetRightTypeOfEither<T extends E.Either<unknown, unknown>> = Extract<T, E.Right<unknown>>['right'];
