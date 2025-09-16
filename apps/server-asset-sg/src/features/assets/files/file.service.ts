import { AssetFile, AssetId, FileProcessingStage, FileProcessingState } from '@asset-sg/shared/v2';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@/core/events';
import { FileS3Service, SaveFileS3Options } from '@/features/assets/files/file-s3.service';
import { CreateFileData, FileIdentifier, FileRepo } from '@/features/assets/files/file.repo';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly fileRepo: FileRepo,
    private readonly fileS3Service: FileS3Service,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private getProcessingConfiguration(
    isOcrCompatible: boolean,
  ): Pick<AssetFile, 'fileProcessingStage' | 'fileProcessingState'> {
    return isOcrCompatible
      ? { fileProcessingState: FileProcessingState.Waiting, fileProcessingStage: FileProcessingStage.Ocr }
      : { fileProcessingState: FileProcessingState.WillNotBeProcessed, fileProcessingStage: null };
  }

  async create(data: UploadFileData): Promise<AssetFile> {
    const { content, mediaType, ...createData } = data;

    const isOcrCompatible = mediaType == 'application/pdf';

    // Store file in DB.
    const record = await this.fileRepo.create({
      ...createData,
      ...this.getProcessingConfiguration(isOcrCompatible),
    });

    // Upload file to S3.
    await this.saveFileOrDeleteRecord(record, data.assetId, content, { mediaType });

    if (isOcrCompatible) {
      this.eventEmitter.emit(EVENTS.FILE_START_OCR, record);
    }

    return record;
  }

  async delete(id: FileIdentifier): Promise<boolean> {
    const file = await this.fileRepo.find(id);
    if (file === null) {
      // The file does not exist (anymore?), so it has not been deleted.
      return false;
    }
    const isDbOk = await this.fileRepo.delete(id);
    if (!isDbOk) {
      // The connection between the asset and the file has been deleted,
      // but the file is still linked to other assets.
      // We still want to communicate that the file was successfully deleted,
      // as by the viewpoint of the API, the deletion has been successful.
      return true;
    }

    // Remove the file from S3, as no asset refers to it anymore.
    return await this.fileS3Service.delete(file.name);
  }

  async deleteOrphans(): Promise<void> {
    const orphans = await this.fileRepo.findOrphans();
    for (const orphan of orphans) {
      await this.fileRepo.deleteUnused(orphan.id);
    }
  }

  private async saveFileOrDeleteRecord(
    record: AssetFile,
    assetId: AssetId,
    content: Buffer,
    options: SaveFileS3Options,
  ): Promise<void> {
    try {
      await this.fileS3Service.save(record.name, content, options);
    } catch (e) {
      await this.deleteRecordSilently({ id: record.id, assetId }, { reason: `S3 upload failed (${e})` });
      throw e;
    }
  }

  private async deleteRecordSilently(id: FileIdentifier, options: { reason: string }) {
    try {
      await this.fileRepo.delete(id);
    } catch (e) {
      this.logger.error('Attempt to delete file from database failed', {
        file: id.id,
        error: e,
        reasonForDeletion: options.reason,
      });
    }
  }
}

type UploadFileData = Omit<CreateFileData, 'fileProcessingState' | 'fileProcessingStage'> & {
  content: Buffer;
  mediaType: string;
};
