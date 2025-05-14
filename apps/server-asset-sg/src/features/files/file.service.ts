import { AssetFile } from '@asset-sg/shared';
import { AssetId, User } from '@asset-sg/shared/v2';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { FileOcrService } from '@/features/files/file-ocr.service';
import { FileS3Service, SaveFileS3Options } from '@/features/files/file-s3.service';
import { CreateFileData, FileIdentifier, FileRepo } from '@/features/files/file.repo';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly fileRepo: FileRepo,
    private readonly fileOcrService: FileOcrService,
    private readonly fileS3Service: FileS3Service,
    private readonly prisma: PrismaService
  ) {}

  async create(data: UploadFileData): Promise<AssetFile> {
    const { content, mediaType, ...createData } = data;

    const isOcrCompatible = data.type !== 'Legal' && mediaType == 'application/pdf';

    // Store file in DB.
    const record = await this.fileRepo.create({
      ...createData,
      ocrStatus: isOcrCompatible ? 'waiting' : 'willNotBeProcessed',
    });

    // Upload file to S3.
    await this.saveFileOrDeleteRecord(record, data.assetId, content, { mediaType });

    if (isOcrCompatible) {
      // Run OCR on the file in the background.
      setTimeout(() => this.fileOcrService.process(record));
    }

    return record;
  }

  async delete(id: FileIdentifier, user: User): Promise<boolean> {
    const file = await this.fileRepo.find(id);
    if (file === null) {
      return false;
    }

    const isDbOk = await this.fileRepo.delete(id);

    // Update the processor fields on the file's asset.
    //
    // Note that we do this regardless of `isDbOk`, as in some cases,
    // that value is `false` due to the file still being in use in other assets.
    this.prisma.asset.update({
      where: { assetId: id.assetId },
      data: { lastProcessedDate: new Date(), processor: user.email },
      select: { assetId: true },
    });

    if (!isDbOk) {
      return false;
    }
    return await this.fileS3Service.delete(file.fileName);
  }

  private async saveFileOrDeleteRecord(
    record: AssetFile,
    assetId: AssetId,
    content: Buffer,
    options: SaveFileS3Options
  ): Promise<void> {
    try {
      await this.fileS3Service.save(record.fileName, content, options);
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

type UploadFileData = Omit<CreateFileData, 'ocrStatus'> & {
  content: Buffer;
  mediaType: string;
};
