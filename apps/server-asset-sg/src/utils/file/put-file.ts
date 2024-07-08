import { unknownToError, unknownToUnknownError } from '@asset-sg/core';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import { assetFolder, bucketName, createS3Client, destroyS3Client } from './common';

export const putFile = (fileName: string, buffer: Buffer, mimetype: string) =>
  pipe(
    TE.bracket(
      createS3Client(),
      (s3Client) =>
        TE.tryCatch(
          () =>
            s3Client.send(
              new PutObjectCommand({
                Key: (assetFolder ? assetFolder + '/' : '') + fileName,
                Body: buffer,
                Bucket: bucketName,
                ContentType: mimetype,
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
