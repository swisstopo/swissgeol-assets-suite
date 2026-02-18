import {
  Asset,
  AssetFile,
  AssetId,
  FileProcessingStage,
  FileProcessingState,
  FulltextContent,
  getLanguageCodesOfPages,
  LanguageCode,
} from '@asset-sg/shared/v2';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { EVENTS } from '@/core/events';
import { PrismaService } from '@/core/prisma.service';
import { FileS3Service, SaveFileS3Options } from '@/features/assets/files/file-s3.service';
import { CreateFileData, FileIdentifier, FileRepo } from '@/features/assets/files/file.repo';
import { mapAssetLanguagesToPrismaUpdate } from '@/features/assets/prisma-asset';
import { streamToUint8Array } from '@/utils/stream';

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

  async loadAllFulltextContentFromS3(writeProgress?: (progress: number) => Promise<void>): Promise<void> {
    const files = await this.prismaService.file.findMany({ select: { id: true, name: true } });
    let i = 0;
    for (const file of files) {
      if (i % 1000 === 0) {
        this.logger.debug('Downloading file fulltext..', {
          total: files.length,
          offset: i,
          progress: Number((i / files.length).toFixed(2)),
        });
        await writeProgress?.(Math.min(i / files.length, 1));
      }
      i++;
      await this.loadFulltextContentFromS3(file.id, file.name);
    }
    writeProgress?.(1);
    this.logger.debug('Done downloading file fulltext.', { total: files.length });
  }

  async loadFulltextContentFromS3(fileId: number, s3FileName: string | null = null): Promise<void> {
    try {
      if (s3FileName === null) {
        const file = await this.prismaService.file.findUnique({ where: { id: fileId }, select: { name: true } });
        if (file === null) {
          this.logger.warn('File not found in database', { fileId });
          return;
        }
        s3FileName = file.name;
      }

      const file = await this.fileS3Service.load(s3FileName);
      if (file === null) {
        this.logger.warn('File not found in S3', { fileId, fileName: s3FileName });
        return;
      }

      const buffer = await streamToUint8Array(file.content);
      const doc = await getDocument(buffer).promise;
      const content: FulltextContent[] = Array(doc.numPages);
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        content[i - 1] = {
          page: i,
          content: textContent.items.map((item) => (item as TextItem).str).join(),
        };
      }

      await this.prismaService.file.update({
        where: { id: fileId },
        data: { fulltextContent: content as unknown as Prisma.JsonArray },
      });
    } catch (e) {
      this.logger.warn('Failed to load fulltext content from S3', { fileId, error: e });
    }
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
