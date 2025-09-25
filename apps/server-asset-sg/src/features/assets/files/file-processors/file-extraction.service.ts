import { isNotNil } from '@asset-sg/core';
import {
  AssetFileId,
  FileProcessingStage,
  FileProcessingState,
  PageCategory,
  PageClassification,
  PageRangeClassification,
  SupportedPageLanguage,
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
import { FileS3Service } from '@/features/assets/files/file-s3.service';
import { requireEnv } from '@/utils/requireEnv';

/**
 * Represents the structure of the extraction result per page returned by the extraction service.
 */
interface ExtractionPage {
  page: number;
  classification: {
    Text: 0 | 1;
    Boreprofile: 0 | 1;
    Map: 0 | 1;
    GeoProfile: 0 | 1;
    TitlePage: 0 | 1;
    Diagram: 0 | 1;
    Table: 0 | 1;
    Unknown: 0 | 1;
  };
  metadata: {
    language: SupportedPageLanguage | null; // note: API currently only has single languages, but GUI allows multiple
    is_frontpage: boolean;
  };
}

/**
 * Represents the structure of the overall extraction result returned by the extraction service.
 */
export interface ExtractionResult {
  filename: string;
  metadata: {
    page_count: number;
    languages: SupportedPageLanguage[];
  };
  pages: ExtractionPage[];
}

type ExternalCategory = keyof ExtractionPage['classification'];
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
export class FileExtractionService extends AbstractProcessingService<ExtractionResult[]> {
  // todo: why array

  protected readonly logger = new Logger(FileExtractionService.name);
  protected readonly processingStage = FileProcessingStage.Extraction;
  protected readonly serviceUrl = requireEnv('EXTRACTION_SERVICE_URL');

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

  protected async postProcess(file: ProcessableFile, result: ExtractionResult[]): Promise<void> {
    const ranges = this.createPageRanges(result[0]);
    try {
      await this.storeRanges(file.id, ranges);
    } catch (e) {
      this.logger.error(`Could not store page range result in database, ${e}`);
      await this.updateStatus(file, FileProcessingState.Error);
    }
  }

  private createPageRanges(result: ExtractionResult): PageRangeClassification[] {
    const pageClassifications = this.transformExtractionResultToPageClassifications(result);
    return transformPagesToRanges(pageClassifications);
  }

  private transformExtractionResultToPageClassifications(result: ExtractionResult): PageClassification[] {
    const pages: PageClassification[] = [];

    for (const page of result.pages) {
      const categories = (Object.keys(page.classification) as ExternalCategory[])
        .filter((key) => page.classification[key] === 1)
        .map((e) => {
          const category = externalToInternalCategoryMap[e];
          if (category == null) {
            this.logger.warn(`Extraction API sent an unknown page classification (it will be ignored): '${e}'`);
          }
          return category;
        })
        .filter(isNotNil);

      const languages = page.metadata.language ? [page.metadata.language] : [];

      pages.push({ page: page.page, categories, languages });
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
}
