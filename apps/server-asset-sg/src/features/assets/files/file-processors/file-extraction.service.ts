import { exit } from 'process';
import { isNotNull } from '@asset-sg/core';
import {
  AssetFileId,
  FileProcessingStage,
  FileProcessingState,
  isDeepEqual,
  PageCategory,
  PageClassification,
  SupportedPageLanguage,
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

/**
 * Represents the structure of the extraction result per page returned by the extraction service.
 */
interface ExtractionPage {
  page: number;
  classification: {
    text: 0 | 1;
    boreprofile: 0 | 1;
    map: 0 | 1;
    geo_profile: 0 | 1;
    title_page: 0 | 1;
    diagram: 0 | 1;
    table: 0 | 1;
    unknown: 0 | 1;
  };
  metadata: {
    language: SupportedPageLanguage | null; // note: API currently only has single languages, but GUI allows multiple
    is_frontpage: boolean;
  };
}

/**
 * Represents the structure of the overall extraction result returned by the extraction service.
 */
interface ExtractionResult {
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
  text: PageCategory.Text,
  boreprofile: PageCategory.Boreprofile,
  map: PageCategory.Map,
  title_page: PageCategory.TitlePage,
  unknown: PageCategory.Unknown,
  geo_profile: PageCategory.GeoProfile,
  diagram: PageCategory.Diagram,
  table: PageCategory.Table,
};

@Injectable()
export class FileExtractionService extends AbstractProcessingService<ExtractionResult[]> {
  // todo: why array

  protected readonly logger = new Logger(FileExtractionService.name);
  protected readonly processingStage = FileProcessingStage.Extraction;
  protected readonly serviceUrl: string;

  constructor(
    protected readonly fileS3Service: FileS3Service,
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    super();

    const serviceUrl = process.env.EXTRACTION_SERVICE_URL as string;
    if (serviceUrl == null || serviceUrl.length == 0) {
      console.error("Missing 'EXTRACTION_SERVICE_URL' environment variable.");
      exit(1);
    }

    this.serviceUrl = serviceUrl;
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

  private createPageRanges(result: ExtractionResult): PageClassification[] {
    const ranges: PageClassification[] = [];

    let currentRange: PageClassification | null = null;

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
        .filter(isNotNull)
        .sort((a, b) => a.localeCompare(b));

      const languages = page.metadata.language ? [page.metadata.language] : [];

      if (
        currentRange &&
        isDeepEqual(categories, currentRange.categories) &&
        isDeepEqual(languages, currentRange.languages)
      ) {
        currentRange.to = page.page;
      } else {
        currentRange = {
          from: page.page,
          to: page.page,
          categories,
          languages,
        };
        ranges.push(currentRange);
      }
    }

    return ranges;
  }

  private async storeRanges(fileId: AssetFileId, ranges: PageClassification[]) {
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        pageClassifications: ranges as unknown as Prisma.JsonArray,
      },
    });
  }
}
