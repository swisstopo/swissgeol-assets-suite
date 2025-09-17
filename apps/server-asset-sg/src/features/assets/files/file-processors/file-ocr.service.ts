import { exit } from 'process';
import { FileProcessingStage, FileProcessingState } from '@asset-sg/shared/v2';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { EVENTS } from '@/core/events';
import { PrismaService } from '@/core/prisma.service';
import {
  AbstractProcessingService,
  ProcessableFile,
} from '@/features/assets/files/file-processors/abstract-processing.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';

@Injectable()
export class FileOcrService extends AbstractProcessingService<[]> {
  protected readonly logger = new Logger(FileOcrService.name);
  protected readonly processingStage = FileProcessingStage.Ocr;
  protected readonly serviceUrl: string;

  constructor(
    protected readonly fileS3Service: FileS3Service,
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    super();

    const serviceUrl = process.env.OCR_SERVICE_URL as string;
    if (serviceUrl == null || serviceUrl.length == 0) {
      console.error("Missing 'OCR_SERVICE_URL' environment variable.");
      exit(1);
    }
    this.serviceUrl = serviceUrl;
  }

  @OnEvent(EVENTS.FILE_START_OCR)
  protected async handleStartEvent(payload: ProcessableFile): Promise<void> {
    void this.process(payload);
  }

  protected async postProcess(file: ProcessableFile, _: []): Promise<void> {
    const data: Prisma.FileUpdateInput = {};

    const metadata = await this.fileS3Service.loadMetadata(file.name);
    if (metadata === null) {
      this.logger.error('Processed file not found in S3', { file: file.name });
      data.fileProcessingState = FileProcessingState.Error;
    } else {
      data.size = metadata.byteCount ?? 0;
      data.pageCount = metadata.pageCount;
    }

    await this.prisma.file.update({
      select: { id: true },
      data,
      where: { id: file.id },
    });

    if (data.fileProcessingState !== FileProcessingState.Error) {
      this.eventEmitter.emit(EVENTS.FILE_START_EXTRACT, file);
    }
  }
}
