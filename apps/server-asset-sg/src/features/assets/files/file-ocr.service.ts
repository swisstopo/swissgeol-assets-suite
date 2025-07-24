import { exit } from 'process';
import { AssetFile, OcrStatus, sleep } from '@asset-sg/shared/v2';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';

const serviceUrl = process.env.OCR_SERVICE_URL as string;
if (serviceUrl == null || serviceUrl.length == 0) {
  console.error("Missing 'OCR_SERVICE_URL' environment variable.");
  exit(1);
}

type OcrFile = Pick<AssetFile, 'id' | 'name' | 'ocrStatus'>;

const BATCH_SIZE = 1;

@Injectable()
export class FileOcrService implements OnModuleInit {
  private readonly logger = new Logger(FileOcrService.name);

  constructor(
    private readonly fileS3Service: FileS3Service,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.processRemaining().then();
  }

  async processRemaining(): Promise<void> {
    const unprocessedFiles = await this.prisma.file.findMany({
      select: { id: true, name: true, ocrStatus: true },
      where: { ocrStatus: { notIn: ['success', 'error', 'willNotBeProcessed'] } },
    });
    const errorCount = await this.prisma.file.count({
      where: { ocrStatus: 'error' },
    });
    if (errorCount > 0) {
      this.logger.log(
        "Found files whose OCR failed. Please reset their 'ocrStatus' manually if you want to retry them.",
        { count: errorCount },
      );
    }

    if (unprocessedFiles.length === 0) {
      this.logger.log('No unprocessed files found.');
      return;
    }

    this.logger.log('Found unprocessed files.', { count: unprocessedFiles.length });

    let batch: Array<Promise<1 | 0>> = [];
    const processBatch = async (): Promise<number> => (await Promise.all(batch)).reduce((a, b) => a + b, 0 as number);

    let successCount = 0;
    for (const file of unprocessedFiles as OcrFile[]) {
      if (batch.length >= BATCH_SIZE) {
        successCount += await processBatch();
        batch = [];
      }
      batch.push(this.processRemainingFile(file).then((ok) => (ok ? 1 : 0)));
    }
    successCount += await processBatch();

    this.logger.log('OCR processing finished.', {
      successes: successCount,
      failures: unprocessedFiles.length - successCount,
    });
  }

  async processRemainingFile(file: OcrFile): Promise<boolean> {
    if (file.ocrStatus === 'processing') {
      this.logger.log('Ongoing OCR found, will attempt to finish it.', { file: file.name });
      try {
        await this.finishProcessing(file);
        this.logger.log('Ongoing OCR finished.', { file: file.name });
        return true;
      } catch (e) {
        this.logger.error(`Failed to finish ongoing OCR, a retry will be attempted.`, {
          file: file.name,
          error: e,
        });
      }
    }
    await this.updateStatus(file, OcrStatus.Created);
    return await this.process(file);
  }

  async process(file: OcrFile): Promise<boolean> {
    try {
      this.logger.log('Starting OCR.', { file: file.name });
      await this.startProcessing(file);
      await this.updateStatus(file, OcrStatus.Processing);
      await this.finishProcessing(file);
      this.logger.log('OCR finished.', { file: file.name });
      return true;
    } catch (e) {
      await this.updateStatus(file, OcrStatus.Error);
      this.logger.error('OCR failed.', { file: file.name, error: e });
      return false;
    }
  }

  async finishProcessing(file: OcrFile): Promise<void> {
    for (;;) {
      await sleep(1000);
      const ok = await this.collectResult(file);
      if (ok) {
        await this.updateStatus(file, OcrStatus.Success);
        return;
      }
    }
  }

  private async updateStatus(file: OcrFile, status: OcrStatus): Promise<void> {
    const data: Prisma.FileUpdateInput = { ocrStatus: status };
    if (status === OcrStatus.Success) {
      const metadata = await this.fileS3Service.loadMetadata(file.name);
      if (metadata === null) {
        this.logger.error('Processed file not found in S3', { file: file.name });
        data.ocrStatus = OcrStatus.Error;
      } else {
        data.size = metadata.byteCount ?? 0;
        data.pageCount = metadata.pageCount;
      }
    }
    await this.prisma.file.update({
      select: { id: true },
      data,
      where: { id: file.id },
    });
  }

  private async startProcessing(file: OcrFile): Promise<void> {
    await this.fetch('/', { file: file.name });
  }

  private async collectResult(file: OcrFile): Promise<boolean> {
    interface ApiData {
      has_finished: boolean;
      data: unknown;
    }

    interface ApiError {
      has_finished: true;
      error: string;
    }

    const data = await this.fetch<ApiData | ApiError>('/collect', { file: file.name });
    if ('error' in data) {
      throw new Error(data.error);
    }
    return data.has_finished;
  }

  private async fetch<T>(path: string, body: object): Promise<T> {
    const response = await fetch(`${serviceUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.status < 200 || response.status > 299) {
      throw await makeResponseError(response);
    }
    if (response.status === 204) {
      // "204 - No Content" indicates that the response does not contain any data.
      // Parsing the body as JSON would most likely fail.
      return undefined as T;
    }
    return await response.json();
  }
}

const makeResponseError = async (response: Response): Promise<Error> => {
  let body = await response.text();
  if (body.length === 0) {
    body = '<empty body>';
  }
  let data = parseJSON(body);
  if (hasKey(data, 'detail')) {
    data = data.detail;
    if (hasKey(data, 'message')) {
      data = data.message;
    }
  } else if (hasKey(data, 'message')) {
    data = data.message;
  }
  data = data ?? body;
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  return new Error(`${response.status} ${response.statusText} - ${message}`);
};

const hasKey = <K extends string>(value: unknown, key: K): value is { [k in K]: unknown } => {
  return value != null && typeof value == 'object' && key in value;
};

const parseJSON = (input: string): unknown | null => {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};
