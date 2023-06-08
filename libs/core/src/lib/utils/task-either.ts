import type { Either } from 'fp-ts/Either';
import type { Task } from 'fp-ts/Task';

import { GetRightTypeOfEither } from './either';

type GetTypeOfTask<T> = T extends Task<infer U> ? U : T;
export type GetRightTypeOfTaskEither<T extends Task<Either<unknown, unknown>>> = GetRightTypeOfEither<GetTypeOfTask<T>>;
