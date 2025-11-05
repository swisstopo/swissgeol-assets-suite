import {
  Asset,
  AssetFile,
  AssetId,
  FileProcessingStage,
  FileProcessingState,
  getLanguageCodesOfPages,
  LanguageCode,
} from '@asset-sg/shared/v2';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@/core/events';
import { PrismaService } from '@/core/prisma.service';
import { FileS3Service, SaveFileS3Options } from '@/features/assets/files/file-s3.service';
import { CreateFileData, FileIdentifier, FileRepo } from '@/features/assets/files/file.repo';
import { mapAssetLanguagesToPrismaUpdate } from '@/features/assets/prisma-asset';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly fileRepo: FileRepo,
    private readonly fileS3Service: FileS3Service,
    private readonly eventEmitter: EventEmitter2,
    private readonly prismaService: PrismaService,
  ) {}

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

  async syncAssetWithRemovedFiles(asset: Asset, removedFiles: AssetFile[]): Promise<Asset> {
    const updatedLanguageCodes = new Set(asset.languageCodes);

    await this.removeLanguagesFromAsset(asset, updatedLanguageCodes, removedFiles);

    await this.prismaService.asset.update({
      where: { assetId: asset.id },
      data: {
        assetLanguages: mapAssetLanguagesToPrismaUpdate(asset.id, [...updatedLanguageCodes]),
      },
    });

    return { ...asset, languageCodes: [...updatedLanguageCodes] };
  }

  async deleteOrphans(): Promise<void> {
    const orphans = await this.fileRepo.findOrphans();
    for (const orphan of orphans) {
      await this.fileRepo.deleteUnused(orphan.id);
    }
  }

  async reanalyzeFile(id: FileIdentifier): Promise<AssetFile> {
    const record = await this.fileRepo.find(id);
    if (record === null) {
      throw new NotFoundException('not found');
    }

    if (
      record.fileProcessingState !== FileProcessingState.Error &&
      record.fileProcessingState !== FileProcessingState.Success
    ) {
      throw new BadRequestException('File is not in a state that allows reanalysis');
    }

    const updatedAsset = await this.fileRepo.update(id, {
      fileProcessingState: FileProcessingState.Waiting,
      fileProcessingStage: FileProcessingStage.Ocr,
    });
    if (updatedAsset === null) {
      throw new NotFoundException('not found');
    }

    this.eventEmitter.emit(EVENTS.FILE_START_OCR, updatedAsset);
    return updatedAsset;
  }

  private getProcessingConfiguration(
    isOcrCompatible: boolean,
  ): Pick<AssetFile, 'fileProcessingStage' | 'fileProcessingState'> {
    return isOcrCompatible
      ? { fileProcessingState: FileProcessingState.Waiting, fileProcessingStage: FileProcessingStage.Ocr }
      : { fileProcessingState: FileProcessingState.WillNotBeProcessed, fileProcessingStage: null };
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

  private async removeLanguagesFromAsset(
    updatedAsset: Asset,
    languages: Set<LanguageCode>,
    removedFiles: AssetFile[],
  ): Promise<void> {
    // Find the languages of the removed files.
    const removedFileLanguages = new Set(
      removedFiles.flatMap((file) =>
        file.pageRangeClassifications === null ? [] : [...getLanguageCodesOfPages(file.pageRangeClassifications ?? [])],
      ),
    );

    // Find the languages present within all other files of the asset.
    const remainingFilesLanguages = new Set(
      updatedAsset.files.flatMap((file) => [...getLanguageCodesOfPages(file.pageRangeClassifications ?? [])]),
    );

    // For each of the deleted file's languages,
    // remove it from the asset's languages,
    // unless another file also has that language.
    for (const removedLang of removedFileLanguages) {
      if (!remainingFilesLanguages.has(removedLang)) {
        languages.delete(removedLang);
      }
    }
  }
}

type UploadFileData = Omit<CreateFileData, 'fileProcessingState' | 'fileProcessingStage'> & {
  content: Buffer;
  mediaType: string;
};
