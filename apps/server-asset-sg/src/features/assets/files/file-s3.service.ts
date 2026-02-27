import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { readEnv, requireEnv } from '@/utils/requireEnv';

const PRESIGNED_URL_DURATION_IN_SECONDS = 60;

@Injectable()
export class FileS3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly folder: string | null;

  constructor() {
    this.bucket = requireEnv('S3_BUCKET_NAME');
    this.folder = requireEnv('S3_ASSET_FOLDER');
    this.client = new S3Client(loadS3ClientConfig());
  }

  async getPresignedUrl(name: string, alias: string | null, forceDownload = false): Promise<string> {
    const command = new GetObjectCommand({
      Key: this.getKey(name),
      Bucket: this.bucket,
      ResponseContentDisposition: forceDownload ? 'attachment; filename="' + (alias ?? name) + '"' : '',
    });
    return getSignedUrl(this.client, command, { expiresIn: PRESIGNED_URL_DURATION_IN_SECONDS });
  }

  async save(name: string, content: Buffer, options: SaveFileS3Options): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Key: this.getKey(name),
        Body: content,
        Bucket: this.bucket,
        ContentType: options.mediaType,
      }),
    );
  }

  async load(name: string, range?: string): Promise<FileS3 | null> {
    try {
      const output = await this.client.send(
        new GetObjectCommand({
          Key: this.getKey(name),
          Bucket: this.bucket,
          Range: range,
        }),
      );
      return {
        content: output.Body as NodeJS.ReadableStream,
        metadata: this.createMetadata(output, name),
      };
    } catch (e) {
      return handleS3Error(e);
    }
  }

  async loadMetadata(name: string): Promise<FileS3Metadata | null> {
    try {
      const output = await this.client.send(
        new HeadObjectCommand({
          Key: this.getKey(name),
          Bucket: this.bucket,
        }),
      );
      return this.createMetadata(output, name);
    } catch (e) {
      return handleS3Error(e);
    }
  }

  async copy(sourceName: string, destinationName: string): Promise<boolean> {
    try {
      await this.client.send(
        new CopyObjectCommand({
          CopySource: `${this.bucket}/${this.getKey(sourceName)}`,
          Key: this.getKey(destinationName),
          Bucket: this.bucket,
        }),
      );
      return true;
    } catch (e) {
      return handleS3Error(e) ?? false;
    }
  }

  async delete(name: string): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Key: this.getKey(name),
          Bucket: this.bucket,
        }),
      );
      return true;
    } catch (e) {
      return handleS3Error(e) ?? false;
    }
  }

  private createMetadata(output: HeadObjectCommandOutput, name: string): FileS3Metadata {
    return {
      name,
      byteCount: output.ContentLength ?? null,
      mediaType: output.ContentType ?? null,
      pageCount: output.Metadata?.pagecount ? Number(output.Metadata.pagecount) : null,
    };
  }
  private getKey(name: string): string {
    return this.folder === null ? name : `${this.folder}/${name}`;
  }
}

export interface SaveFileS3Options {
  mediaType: string;
}

interface FileS3 {
  content: NodeJS.ReadableStream;
  metadata: FileS3Metadata;
}

interface FileS3Metadata {
  name: string;
  byteCount: number | null;
  mediaType: string | null;
  pageCount: number | null;
}

const loadS3ClientConfig = (): S3ClientConfig => {
  return {
    region: requireEnv('S3_REGION'),
    endpoint: requireEnv('S3_ENDPOINT'),
    credentials: loadS3ClientCredentials(),

    // Disables the client automatically appending the hostname to the bucket name.
    forcePathStyle: true,
  };
};

const loadS3ClientCredentials = (): S3ClientConfig['credentials'] => {
  const accessKeyId = readEnv('S3_ACCESS_KEY_ID');
  const secretAccessKey = readEnv('S3_SECRET_ACCESS_KEY');

  if (accessKeyId !== null && secretAccessKey !== null) {
    return { accessKeyId, secretAccessKey };
  } else if (accessKeyId === secretAccessKey) {
    return undefined;
  }
  console.error(`Either both or none of 'S3_ACCESS_KEY_ID' and 'S3_SECRET_ACCESS_KEY' must be set.`);
  process.exit(1);
};

const handleS3Error = (e: unknown): null | never => {
  if (e instanceof S3ServiceException && e.name === 'NoSuchKey') {
    return null;
  }
  throw e;
};
