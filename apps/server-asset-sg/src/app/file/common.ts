import { S3Client } from '@aws-sdk/client-s3';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as D from 'io-ts/Decoder';

import { unknownToError } from '@asset-sg/core';

const AssetS3Config = D.struct({
    s3ClientConfig: D.struct({
        region: D.string,
        endpoint: D.string,
        credentials: D.struct({
            accessKeyId: D.string,
            secretAccessKey: D.string,
        }),
        forcePathStyle: D.boolean,
    }),
    bucketName: D.string,
    assetFolder: D.string,
});

const maybeAssetS3Config = AssetS3Config.decode({
    s3ClientConfig: {
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },

        // Disables the client automatically appending the hostname to the bucket name.
        forcePathStyle: true,
    },
    bucketName: process.env.S3_BUCKET_NAME,
    assetFolder: process.env.S3_ASSET_FOLDER,
});

if (E.isLeft(maybeAssetS3Config)) {
    throw new Error(`Invalid S3 config: ${D.draw(maybeAssetS3Config.left)}}`);
}

export const { s3ClientConfig, bucketName, assetFolder } = maybeAssetS3Config.right;

export const createS3Client = () => TE.fromEither(E.tryCatch(() => new S3Client(s3ClientConfig), unknownToError));
export const destroyS3Client = (s3Client: S3Client) => E.tryCatch(() => s3Client.destroy(), unknownToError);
