import * as path from 'node:path';
import {
  Asset,
  AssetFile,
  AssetFileMetadataResponse,
  AssetId,
  FileProcessingStage,
  FileProcessingState,
  FulltextContent,
  getLanguageCodesOfPages,
  LanguageCode,
} from '@asset-sg/shared/v2';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocumentProxy, TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import { EVENTS } from '@/core/events';
import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileS3Service, SaveFileS3Options } from '@/features/assets/files/file-s3.service';
import { CreateFileData, FileIdentifier, FileRepo } from '@/features/assets/files/file.repo';
import { PdfMetadataService } from '@/features/assets/files/pdf-metadata.service';
import { mapAssetLanguagesToPrismaUpdate } from '@/features/assets/prisma-asset';
import { SearchWriterService } from '@/features/assets/search/search-writer.service';
import { sanitizeTextForJson } from '@/utils/sanitize';
import { withTimeout } from '@/utils/timeout';

// eval('require') bypasses webpack's static require analysis so the path is resolved at runtime by Node.js.
const STANDARD_FONT_DATA_URL =
  path.join(path.dirname((eval('require') as NodeRequire).resolve('pdfjs-dist/package.json')), 'standard_fonts') +
  path.sep;

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly fileRepo: FileRepo,
    private readonly fileS3Service: FileS3Service,
    private readonly eventEmitter: EventEmitter2,
    private readonly prismaService: PrismaService,
    private readonly pdfMetadataService: PdfMetadataService,
    private readonly assetRepo: AssetRepo,
    private readonly searchWriterService: SearchWriterService,
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

    // Re-register asset in ES so the `hasFiles` flag is updated.
    const asset = await this.assetRepo.find(data.assetId);
    if (asset != null) {
      await this.searchWriterService.register(asset);
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
      return false;
    }

    // Remove the file from S3.
    return await this.fileS3Service.delete(file.name);
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

  async getOrExtractMetadata(file: AssetFile): Promise<AssetFileMetadataResponse> {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('Metadata is only available for PDF files');
    }

    if (file.pageDimensions && file.pageDimensions.length > 0) {
      this.logger.debug('Returning cached page dimensions', {
        fileId: file.id,
        fileName: file.name,
        pageCount: file.pageCount,
      });
      return {
        pageCount: file.pageCount ?? file.pageDimensions.length,
        pageDimensions: file.pageDimensions,
      };
    }

    this.logger.log('Page dimensions not cached, extracting from PDF', {
      fileId: file.id,
      fileName: file.name,
    });

    try {
      const presignedUrl = await this.fileS3Service.getPresignedUrl(file.name, file.alias, false);
      const metadata = await this.pdfMetadataService.extractMetadata(presignedUrl);

      await this.prismaService.file.update({
        where: { id: file.id },
        data: {
          pageDimensions: metadata.pageDimensions as unknown as Prisma.JsonArray,
          ...(file.pageCount === null && { pageCount: metadata.pageCount }),
        },
      });

      this.logger.log('Successfully extracted and cached page dimensions', {
        fileId: file.id,
        fileName: file.name,
        pageCount: metadata.pageCount,
        dimensionsCount: metadata.pageDimensions.length,
      });

      return metadata;
    } catch (error) {
      this.logger.error('Failed to extract PDF metadata', {
        fileId: file.id,
        fileName: file.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerErrorException('Failed to extract PDF metadata');
    }
  }

  async loadAllFulltextContentFromS3(writeProgress?: (progress: number) => Promise<void>): Promise<void> {
    const files = await this.prismaService.file.findMany({ select: { id: true } });
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
      await this.loadFulltextContentFromS3(file.id);
    }
    await writeProgress?.(1);
    this.logger.debug('Done downloading file fulltext.', { total: files.length });
  }

  async loadFulltextContentFromS3(fileId: number): Promise<void> {
    try {
      const file = await this.prismaService.file.findUnique({
        where: { id: fileId },
        select: { name: true, nameAlias: true },
      });
      if (file === null) {
        this.logger.warn('File not found in database', { fileId });
        return;
      }

      const metadata = await this.fileS3Service.loadMetadata(file.name);
      if (metadata === null) {
        this.logger.warn('File not found in S3', { fileId, fileName: file.name });
        return;
      }

      const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
      if (metadata.byteCount != null && metadata.byteCount > MAX_FILE_SIZE) {
        this.logger.warn('Skipping fulltext extraction: file exceeds 2 GB size limit', {
          fileId,
          fileName: file.name,
          fileSize: `${(metadata.byteCount / (1024 * 1024 * 1024)).toFixed(2)} GB`,
        });
        return;
      }

      const presignedUrl = await this.fileS3Service.getPresignedUrl(file.name, file.nameAlias, false);
      if (presignedUrl === null) {
        this.logger.warn('File not found in S3', { fileId, fileName: file.name });
        return;
      }

      const content: FulltextContent[] = [];
      for await (const page of this.streamPdfPages(presignedUrl)) {
        content.push({
          page: page.pageNumber,
          content: page.text,
        });
      }
      await this.prismaService.file.update({
        where: { id: fileId },
        data: { fulltextContent: content as unknown as Prisma.JsonArray },
      });
    } catch (e) {
      this.logger.warn('Failed to load fulltext content from S3', {
        fileId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  private async *streamPdfPages(presignedUrl: string) {
    // Save loadingTask before awaiting so it can always be destroyed in the finally block,
    // even if the promise rejects (e.g. 503 from S3). Without this, pdfjs internal tasks
    // leak as unhandled rejections that crash Node.js.
    const loadingTask = getDocument({
      url: presignedUrl,
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
      disableAutoFetch: true,
      disableStream: false,
    });
    let doc: PDFDocumentProxy | null = null;
    try {
      doc = await withTimeout(loadingTask.promise, 300_000, 'PDF loading timed out');

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await withTimeout(doc.getPage(i), 30_000, `Loading page ${i} timed out`);
        const textContent = await withTimeout(page.getTextContent(), 30_000, `Text extraction for page ${i} timed out`);
        const rawText = textContent.items
          .filter((item: TextItem | TextMarkedContent) => 'str' in item)
          .map((item: { str: string }) => item.str)
          .join(' ');
        const text = sanitizeTextForJson(rawText);
        page.cleanup();
        yield { pageNumber: i, text };
      }
    } catch (error) {
      this.logger.warn('streamPdfPages error in try block', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      await withTimeout(loadingTask.destroy(), 30_000, 'PDF cleanup timed out').catch((e) => {
        this.logger.warn('loadingTask.destroy() timed out or failed', {
          error: e instanceof Error ? e.message : String(e),
        });
      });
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
