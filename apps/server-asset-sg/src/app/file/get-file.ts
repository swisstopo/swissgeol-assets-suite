import { GetObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import { unknownToError } from '@asset-sg/core';

import { assetFolder, bucketName, createS3Client, destroyS3Client } from './common';

export const getFile = (prismaClient: PrismaClient, fileId: number) => {
    return TE.bracket(
        createS3Client(),
        s3Client =>
            pipe(
                TE.tryCatch(() => pipe(prismaClient.file.findFirstOrThrow({ where: { fileId } })), unknownToError),
                TE.chain(({ fileName }) =>
                    pipe(
                        TE.tryCatch(
                            () =>
                                s3Client.send(
                                    new GetObjectCommand({
                                        Key: (assetFolder ? assetFolder + '/' : '') + fileName,
                                        Bucket: bucketName,
                                    }),
                                ),
                            unknownToError,
                        ),
                        TE.map(a => ({ ...a, fileName })),
                    ),
                ),
                TE.map(a => ({
                    fileName: a.fileName,
                    stream: a.Body as NodeJS.ReadableStream,
                    contentType: a.ContentType,
                    contentLength: a.ContentLength,
                })),
            ),
        (s3Client, result) => {
            if (E.isLeft(result)) {
                destroyS3Client(s3Client);
            } else {
                const { stream } = result.right;
                const cleanup = () => {
                    stream.removeListener('end', cleanup);
                    stream.removeListener('error', cleanup);
                    destroyS3Client(s3Client);
                };
                stream.addListener('end', cleanup);
                stream.addListener('error', cleanup);
            }
            return TE.of(void 0);
        },
    );
};
