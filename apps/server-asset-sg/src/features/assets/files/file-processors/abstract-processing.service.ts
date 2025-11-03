import { AssetFile, FileProcessingStage, FileProcessingState, sleep } from '@asset-sg/shared/v2';
import { Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';

export type ProcessableFile = Pick<AssetFile, 'id' | 'name' | 'fileProcessingState' | 'fileProcessingStage'>;

const BATCH_SIZE = 1;

interface ApiData<T> {
  has_finished: boolean;
  data: T;
}

export abstract class AbstractProcessingService<T> implements OnModuleInit {
  protected abstract readonly logger: Logger;
  protected abstract readonly fileS3Service: FileS3Service;
  protected abstract readonly prisma: PrismaService;
  protected abstract readonly eventEmitter: EventEmitter2;
  protected abstract readonly processingStage: FileProcessingStage;
  protected abstract serviceUrl: string;
  protected abstract serviceVersion: string | undefined;

  public onModuleInit() {
    this.processRemaining().then();
  }

  protected abstract handleStartEvent(file: ProcessableFile): Promise<void>;

  /**
   * Called when the processing in the API was successfully completed and the file status updated in the database.
   * @param file
   * @param result
   * @protected
   */
  protected abstract postProcess(file: ProcessableFile, result: T): Promise<void>;
  protected async process(file: ProcessableFile): Promise<boolean> {
    try {
      this.logger.log(`Starting ${this.processingStage}.`, { file: file.name });
      await this.startProcessing(file);
      await this.updateStatus(file, FileProcessingState.Processing);
      await this.finishProcessing(file);
      this.logger.log(`${this.processingStage} finished.`, { file: file.name });
      return true;
    } catch (e) {
      await this.updateStatus(file, FileProcessingState.Error);
      this.logger.error(`${this.processingStage} failed.`, { file: file.name, error: e });
      return false;
    }
  }

  private getFullServiceUrl(): string {
    if (this.serviceVersion) {
      return `${this.serviceUrl}/${this.serviceVersion}`;
    }
    return this.serviceUrl;
  }

  private async processRemaining(): Promise<void> {
    const unprocessedFiles = await this.prisma.file.findMany({
      select: { id: true, name: true, fileProcessingState: true, fileProcessingStage: true },
      where: {
        fileProcessingState: {
          notIn: [FileProcessingState.Success, FileProcessingState.Error, FileProcessingState.WillNotBeProcessed],
        },
        fileProcessingStage: this.processingStage,
      },
    });
    const errorCount = await this.prisma.file.count({
      where: { fileProcessingState: FileProcessingState.Error, fileProcessingStage: this.processingStage },
    });
    if (errorCount > 0) {
      this.logger.log(
        `Found files whose ${this.processingStage} failed. Please reset their 'fileProcessingState' manually if you want to retry them.`,
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
    for (const file of unprocessedFiles as ProcessableFile[]) {
      if (batch.length >= BATCH_SIZE) {
        successCount += await processBatch();
        batch = [];
      }
      batch.push(this.processRemainingFile(file).then((ok) => (ok ? 1 : 0)));
    }
    successCount += await processBatch();

    this.logger.log(`${this.processingStage} processing finished.`, {
      successes: successCount,
      failures: unprocessedFiles.length - successCount,
    });
  }

  private async processRemainingFile(file: ProcessableFile): Promise<boolean> {
    if (file.fileProcessingState === FileProcessingState.Processing) {
      this.logger.log(`Ongoing ${this.processingStage} found, will attempt to finish it.`, { file: file.name });
      try {
        await this.finishProcessing(file);
        this.logger.log(`Ongoing ${this.processingStage} finished.`, { file: file.name });
        return true;
      } catch (e) {
        this.logger.error(`Failed to finish ongoing ${this.processingStage}, a retry will be attempted.`, {
          file: file.name,
          error: e,
        });
      }
    }
    await this.updateStatus(file, FileProcessingState.Waiting);
    return await this.process(file);
  }

  private async finishProcessing(file: ProcessableFile): Promise<void> {
    for (;;) {
      await sleep(1000);
      const result = await this.collectResult(file);

      if (result.has_finished) {
        await this.updateStatus(file, FileProcessingState.Success);
        void this.postProcess(file, result.data);
        return;
      }
    }
  }

  protected async updateStatus(file: ProcessableFile, status: FileProcessingState): Promise<void> {
    const data: Prisma.FileUpdateInput = { fileProcessingState: status, fileProcessingStage: this.processingStage };

    await this.prisma.file.update({
      select: { id: true },
      data,
      where: { id: file.id },
    });
  }

  private async startProcessing(file: ProcessableFile): Promise<void> {
    await this.fetch('/', { file: file.name });
  }

  private async collectResult(file: ProcessableFile): Promise<ApiData<T>> {
    interface ApiError {
      has_finished: true;
      error: string;
    }

    const data = await this.fetch<ApiData<T> | ApiError>('/collect', { file: file.name });
    if ('error' in data) {
      throw new Error(data.error);
    }
    return data;
  }

  private async fetch<T>(path: string, body: object): Promise<T> {
    const response = await fetch(`${this.getFullServiceUrl()}${path}`, {
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
