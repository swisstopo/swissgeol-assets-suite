import {
  AssetFileId,
  FileProcessingStage,
  FileProcessingState,
  getLanguageCodesOfPages,
  PageCategory,
  PageClassification,
  PageRangeClassification,
  SupportedPageLanguage,
  SupportedPageLanguages,
  transformPagesToRanges,
} from '@asset-sg/shared/v2';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { EVENTS } from '@/core/events';
import { PrismaService } from '@/core/prisma.service';
import {
  AbstractProcessingService,
  ProcessableFile,
} from '@/features/assets/files/file-processors/abstract-processing.service';
import {
  PagePrediction,
  PredictionSchema,
} from '@/features/assets/files/file-processors/file-extraction/extraction-service-generated.interfaces';
import { FileS3Service } from '@/features/assets/files/file-s3.service';
import { requireEnv } from '@/utils/requireEnv';

type ExternalCategory = 'Text' | 'Boreprofile' | 'Map' | 'TitlePage' | 'Unknown' | 'GeoProfile' | 'Diagram' | 'Table';
type CategoryMap = {
  [key in ExternalCategory]: PageCategory;
};

const externalToInternalCategoryMap: CategoryMap = {
  Text: PageCategory.Text,
  Boreprofile: PageCategory.Boreprofile,
  Map: PageCategory.Map,
  TitlePage: PageCategory.TitlePage,
  Unknown: PageCategory.Unknown,
  GeoProfile: PageCategory.GeoProfile,
  Diagram: PageCategory.Diagram,
  Table: PageCategory.Table,
};

@Injectable()
export class FileExtractionService extends AbstractProcessingService<PredictionSchema[]> {
  // todo: why array

  protected readonly logger = new Logger(FileExtractionService.name);
  protected readonly processingStage = FileProcessingStage.Extraction;
  protected readonly serviceUrl = requireEnv('EXTRACTION_SERVICE_URL');
  protected readonly serviceVersion = 'v1';

  constructor(
    protected readonly fileS3Service: FileS3Service,
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }
  @OnEvent(EVENTS.FILE_START_EXTRACT)
  protected async handleStartEvent(payload: ProcessableFile): Promise<void> {
    void this.process(payload);
  }

  protected async postProcess(file: ProcessableFile, result: PredictionSchema[]): Promise<void> {
    const ranges = this.createPageRanges(result[0].pages);
    try {
      await this.storeRanges(file.id, ranges);
      await this.storeLanguages(file.id, result);
    } catch (e) {
      this.logger.error(`Could not store page range result in database, ${e}`);
      await this.updateStatus(file, FileProcessingState.Error);
    }
  }

  private createPageRanges(result: PagePrediction[]): PageRangeClassification[] {
    const pageClassifications = this.transformExtractionResultToPageClassifications(result);
    return transformPagesToRanges(pageClassifications);
  }

  private transformExtractionResultToPageClassifications(result: PagePrediction[]): PageClassification[] {
    const pages: PageClassification[] = [];

    for (const page of result) {
      // note: in v1, the API only returns a single predicted class per page, but we keep the structure for multiple categories for future use
      const categories: PageCategory[] = [];
      if (page.predicted_class in externalToInternalCategoryMap) {
        categories.push(externalToInternalCategoryMap[page.predicted_class as ExternalCategory]);
      } else {
        this.logger.warn(
          `Extraction API sent an unknown page classification (it will be ignored): '${page.predicted_class}'`,
        );
      }

      const languages =
        page.page_metadata.language && this.isSupportedPageLanguage(page.page_metadata.language)
          ? [page.page_metadata.language]
          : [];

      pages.push({ page: page.page_number, categories, languages });
    }

    return pages;
  }

  private async storeRanges(fileId: AssetFileId, ranges: PageRangeClassification[]) {
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

  private async storeLanguages(fileId: AssetFileId, results: PredictionSchema[]): Promise<void> {
    // Find all languages that have been extracted.
    const languages = getLanguageCodesOfPages(
      results.map((it) => ({ languages: it.metadata.languages.filter(this.isSupportedPageLanguage) })),
    );

    // Find all assets that are mapped to the processed file.
    const assets = await this.prisma.assetFile.findMany({
      where: { fileId },
      select: { assetId: true },
    });

    // For each asset, add all languages that have not yet been mapped to it.
    await this.prisma.assetLanguage.createMany({
      data: assets.flatMap(({ assetId }) => [...languages].map((code) => ({ assetId, languageItemCode: code }))),
      skipDuplicates: true,
    });
  }
}
