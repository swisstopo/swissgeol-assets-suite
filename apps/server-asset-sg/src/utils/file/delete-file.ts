import { unknownToError, unknownToUnknownError } from '@asset-sg/core';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';

import { assetFolder, bucketName, createS3Client, destroyS3Client } from './common';

export const deleteFile = (fileName: string) => {
  return pipe(
    TE.bracket(
      createS3Client(),
      (s3Client) =>
        TE.tryCatch(
          () =>
            s3Client.send(
              new DeleteObjectCommand({
                Key: (assetFolder ? assetFolder + '/' : '') + fileName,
                Bucket: bucketName,
              })
            ),
          unknownToError
        ),
      (s3Client) => {
        destroyS3Client(s3Client);
        return TE.of(void 0);
      }
    ),
    TE.mapLeft(unknownToUnknownError)
  );
};
