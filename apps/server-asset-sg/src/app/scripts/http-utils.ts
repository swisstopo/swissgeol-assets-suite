import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { Response } from 'node-fetch';

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { unknownToError } from '@asset-sg/core';

export const httpJson = (req: () => Promise<Response>) =>
    pipe(
        TE.tryCatch(() => req(), unknownToError),
        TE.chain(response =>
            response.status === 200
                ? TE.right(response)
                : pipe(
                      TE.tryCatch(() => response.text(), unknownToError),
                      TE.bimap(
                          e => e,
                          responseText =>
                              new Error(`Invalid response: ${response.status} ${response.statusText} ${responseText}`),
                      ),
                      TE.chain(TE.left),
                  ),
        ),
        TE.chain(response => TE.tryCatch(() => response.json(), unknownToError)),
    );

export const printResult = (result: E.Either<Error, unknown>) =>
    console.log(
        pipe(
            result,
            E.fold(
                error => JSON.stringify(error.message, null, 2),
                settings => JSON.stringify(settings, null, 2),
            ),
        ),
    );
