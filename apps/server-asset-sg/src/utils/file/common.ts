import { unknownToError } from '@asset-sg/core';
import { S3Client } from '@aws-sdk/client-s3';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

interface S3ClientConfig {
  region: string;
  endpoint: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  forcePathStyle: boolean;
}

const maybeEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return value == null || value.length === 0 ? undefined : value;
};

const env = (name: string): string => {
  const value = maybeEnv(name);
  if (value == null) {
    console.error(`missing environment variable '${name}'`);
    process.exit(1);
  }
  return value;
};

export const bucketName = env('S3_BUCKET_NAME');
export const assetFolder = env('S3_ASSET_FOLDER');

const s3ClientConfig: S3ClientConfig = {
  region: env('S3_REGION'),
  endpoint: env('S3_ENDPOINT'),

  // Disables the client automatically appending the hostname to the bucket name.
  forcePathStyle: true,
};

const credentials: Partial<S3ClientConfig['credentials']> = {
  accessKeyId: maybeEnv('S3_ACCESS_KEY_ID'),
  secretAccessKey: maybeEnv('S3_SECRET_ACCESS_KEY'),
};

if (credentials.accessKeyId != null && credentials.secretAccessKey != null) {
  s3ClientConfig.credentials = credentials as S3ClientConfig['credentials'];
} else if (credentials.accessKeyId != credentials.secretAccessKey) {
  console.error(`Either both or none of 'S3_ACCESS_KEY_ID' and 'S3_SECRET_ACCESS_KEY' must be set.`);
  process.exit(1);
}

export const createS3Client = () => TE.fromEither(E.tryCatch(() => new S3Client(s3ClientConfig), unknownToError));
export const destroyS3Client = (s3Client: S3Client) => E.tryCatch(() => s3Client.destroy(), unknownToError);
