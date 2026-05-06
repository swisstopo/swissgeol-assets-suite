import {
  AssetFileId,
  FileProcessingStage,
  FileProcessingState,
  getLanguageCodesOfPages,
  PageCategory,
  PageRangeClassification,
  SupportedPageLanguage,
  SupportedPageLanguages,
} from '@asset-sg/shared/v2';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PageClasses, ProcessedEntities, ProcessorDocumentEntities } from './extraction-service-generated.interfaces';
import { EVENTS } from '@/core/events';
import { PrismaService } from '@/core/prisma.service';
import {
  AbstractProcessingService,
  ProcessableFile,
} from '@/features/assets/files/file-processors/abstract-processing.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';
import { requireEnv } from '@/utils/requireEnv';

type CategoryMap = {
  [key in PageClasses]: PageCategory;
};

const entityClassificationToPageCategory: CategoryMap = {
  [PageClasses.Boreprofile]: PageCategory.Boreprofile,
  [PageClasses.Diagram]: PageCategory.Diagram,
  [PageClasses.GeoProfile]: PageCategory.GeoProfile,
  [PageClasses.Map]: PageCategory.Map,
  [PageClasses.SectionHeader]: PageCategory.Text,
  [PageClasses.Table]: PageCategory.Table,
  [PageClasses.Text]: PageCategory.Text,
  [PageClasses.TitlePage]: PageCategory.TitlePage,
  [PageClasses.Unknown]: PageCategory.Unknown,
};

@Injectable()
export class FileExtractionService extends AbstractProcessingService<ProcessorDocumentEntities | null> {
  protected readonly logger = new Logger(FileExtractionService.name);
  protected readonly processingStage = FileProcessingStage.Extraction;
  protected readonly serviceUrl = requireEnv('EXTRACTION_SERVICE_URL');
  protected readonly serviceVersion = 'v2';

  constructor(
    protected readonly fileS3Service: FileS3Service,
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  @OnEvent(EVENTS.FILE_START_EXTRACT)
  protected async handleStartEvent(payload: ProcessableFile): Promise<void> {
    this.logger.log('[EXTRACT-V2] Received FILE_START_EXTRACT event.', { fileId: payload.id, fileName: payload.name });
    void this.process(payload);
  }

  protected async postProcess(file: ProcessableFile, result: ProcessorDocumentEntities | null): Promise<void> {
    this.logger.log('[EXTRACT-V2] postProcess called.', {
      fileId: file.id,
      fileName: file.name,
      hasResult: result != null,
      entityCount: result?.entities?.length ?? 0,
    });

    if (result == null || !Array.isArray(result.entities)) {
      this.logger.error('[EXTRACT-V2] Extraction API returned no valid result.');
      await this.updateStatus(file, FileProcessingState.Error);
      return;
    }

    const ranges = this.mapEntitiesToPageRanges(result.entities);
    try {
      await this.storeRanges(file.id, ranges);
      await this.storeLanguages(file.id, result);
    } catch (e) {
      this.logger.error(`Could not store page range result in database, ${e}`);
      await this.updateStatus(file, FileProcessingState.Error);
    }
  }

  private mapEntitiesToPageRanges(entities: ProcessedEntities[]): PageRangeClassification[] {
    return entities.map((entity) => {
      const category = entityClassificationToPageCategory[entity.classification];
      if (category == null) {
        this.logger.warn(
          `Extraction API sent an unknown entity classification (it will be treated as Unknown): '${entity.classification}'`,
        );
      }

      const languages = entity.language && this.isSupportedPageLanguage(entity.language) ? [entity.language] : [];

      return {
        from: entity.page_start,
        to: entity.page_end,
        categories: [category ?? PageCategory.Unknown],
        languages,
        label: entity.title,
      };
    });
  }

  private async storeRanges(fileId: AssetFileId, ranges: PageRangeClassification[]): Promise<void> {
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        pageRangeClassifications: ranges as unknown as Prisma.JsonArray,
      },
    });
  }

  private isSupportedPageLanguage(language: string): language is SupportedPageLanguage {
    if ((SupportedPageLanguages as readonly string[]).includes(language)) {
      return true;
    } else {
      this.logger.warn(`Extraction API sent an unknown language (it will be ignored): '${language}'`);
      return false;
    }
  }

  private async storeLanguages(fileId: AssetFileId, result: ProcessorDocumentEntities): Promise<void> {
    const languages = getLanguageCodesOfPages([
      { languages: result.languages.filter((l) => this.isSupportedPageLanguage(l)) },
    ]);

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: { assetId: true },
    });

    if (file == null) {
      this.logger.warn(`File ${fileId} not found, cannot store languages.`);
      return;
    }

    await this.prisma.assetLanguage.createMany({
      data: [...languages].map((code) => ({ assetId: file.assetId, languageItemCode: code })),
      skipDuplicates: true,
    });
  }
}
