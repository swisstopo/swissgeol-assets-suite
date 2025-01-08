import { unknownToError } from '@asset-sg/core';
import { S3Client } from '@aws-sdk/client-s3';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { readEnv, requireEnv } from '@/utils/requireEnv';

interface S3ClientConfig {
  region: string;
  endpoint: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  forcePathStyle: boolean;
}

export const bucketName = requireEnv('S3_BUCKET_NAME');
export const assetFolder = requireEnv('S3_ASSET_FOLDER');
export const region = requireEnv('S3_REGION');

const s3ClientConfig: S3ClientConfig = {
  region,
  endpoint: requireEnv('S3_ENDPOINT'),

  // Disables the client automatically appending the hostname to the bucket name.
  forcePathStyle: true,
};

const credentials: Partial<S3ClientConfig['credentials']> = {
  accessKeyId: readEnv('S3_ACCESS_KEY_ID') ?? undefined,
  secretAccessKey: readEnv('S3_SECRET_ACCESS_KEY') ?? undefined,
};

if (credentials.accessKeyId != null && credentials.secretAccessKey != null) {
  s3ClientConfig.credentials = credentials as S3ClientConfig['credentials'];
} else if (credentials.accessKeyId != credentials.secretAccessKey) {
  console.error(`Either both or none of 'S3_ACCESS_KEY_ID' and 'S3_SECRET_ACCESS_KEY' must be set.`);
  process.exit(1);
}

export const createS3Client = () => TE.fromEither(E.tryCatch(() => new S3Client(s3ClientConfig), unknownToError));
export const destroyS3Client = (s3Client: S3Client) => E.tryCatch(() => s3Client.destroy(), unknownToError);
