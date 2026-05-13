import { FileProcessingStage, FileProcessingState, PageCategory } from '@asset-sg/shared/v2';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { PageClasses, ProcessorDocumentEntities } from './extraction-service-generated.interfaces';
import { FileExtractionService } from './file-extraction.service';
import { PrismaService } from '@/core/prisma.service';
import { ProcessableFile } from '@/features/assets/files/file-processors/abstract-processing.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';

describe('FileExtractionService (v2)', () => {
  let service: FileExtractionService;

  const mockFileS3Service = {};
  const mockPrismaService = {
    file: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    assetLanguage: {
      createMany: jest.fn(),
    },
  };
  const mockEventEmitter = { emit: jest.fn() };

  const processableFile: ProcessableFile = {
    id: 1,
    name: 'test.pdf',
    fileProcessingState: FileProcessingState.Waiting,
    fileProcessingStage: FileProcessingStage.Extraction,
  };

  beforeAll(() => {
    process.env.EXTRACTION_SERVICE_URL = 'http://localhost:8000';
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      /* empty */
    });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {
      /* empty */
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileExtractionService,
        { provide: FileS3Service, useValue: mockFileS3Service },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<FileExtractionService>(FileExtractionService);
  });

  describe('mapEntitiesToPageRanges', () => {
    it('maps entities to page ranges with categories and supported language', () => {
      const result: ProcessorDocumentEntities = {
        filename: 'test.pdf',
        page_count: 2,
        languages: ['de'],
        entities: [
          {
            classification: PageClasses.Text,
            language: 'de',
            page_start: 1,
            page_end: 1,
            title: 'Intro',
          },
          {
            classification: PageClasses.SectionHeader,
            language: null,
            page_start: 2,
            page_end: 3,
            title: 'Header',
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.mapEntitiesToPageRanges(result.entities);

      expect(ranges).toEqual([
        {
          from: 1,
          to: 1,
          categories: [PageCategory.Text],
          languages: ['de'],
          label: 'Intro',
        },
        {
          from: 2,
          to: 3,
          categories: [PageCategory.Text],
          languages: [],
          label: 'Header',
        },
      ]);
    });

    it('falls back to unknown category and warns for unknown classification', () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      const unknownClassification = 'new_classification';

      const result: ProcessorDocumentEntities = {
        filename: 'test.pdf',
        page_count: 1,
        languages: ['de'],
        entities: [
          {
            classification: unknownClassification as unknown as PageClasses,
            language: 'de',
            page_start: 1,
            page_end: 1,
            title: 'Unknown',
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.mapEntitiesToPageRanges(result.entities);

      expect(ranges).toEqual([
        {
          from: 1,
          to: 1,
          categories: [PageCategory.Unknown],
          languages: ['de'],
          label: 'Unknown',
        },
      ]);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        `Extraction API sent an unknown entity classification (it will be treated as Unknown): '${unknownClassification}'`,
      );
    });

    it('ignores unsupported languages and logs a warning', () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      const unsupportedLanguage = 'xx';

      const result: ProcessorDocumentEntities = {
        filename: 'test.pdf',
        page_count: 1,
        languages: [unsupportedLanguage],
        entities: [
          {
            classification: PageClasses.Map,
            language: unsupportedLanguage,
            page_start: 1,
            page_end: 2,
            title: 'Map',
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.mapEntitiesToPageRanges(result.entities);

      expect(ranges).toEqual([
        {
          from: 1,
          to: 2,
          categories: [PageCategory.Map],
          languages: [],
          label: 'Map',
        },
      ]);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        `Extraction API sent an unknown language (it will be ignored): '${unsupportedLanguage}'`,
      );
    });
  });

  describe('postProcess', () => {
    it('marks file as error when extraction result is null', async () => {
      const updateStatusSpy = jest.spyOn(service as any, 'updateStatus').mockImplementation(async () => undefined);

      // @ts-expect-error - testing a protected method
      await service.postProcess(processableFile, null);

      expect(updateStatusSpy).toHaveBeenCalledWith(processableFile, FileProcessingState.Error);
      expect(mockPrismaService.file.update).not.toHaveBeenCalled();
      expect(mockPrismaService.assetLanguage.createMany).not.toHaveBeenCalled();
    });

    it('stores ranges and deduplicated valid languages for successful results', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue({ assetId: 'asset-1' });

      const result: ProcessorDocumentEntities = {
        filename: 'test.pdf',
        page_count: 2,
        languages: ['de', 'de', 'xx'],
        entities: [
          {
            classification: PageClasses.Boreprofile,
            language: 'de',
            page_start: 1,
            page_end: 2,
            title: 'BS1',
          },
        ],
      };

      // @ts-expect-error - testing a protected method
      await service.postProcess(processableFile, result);

      expect(mockPrismaService.file.update).toHaveBeenCalledWith({
        where: { id: processableFile.id },
        data: {
          pageRangeClassifications: [
            {
              from: 1,
              to: 2,
              categories: [PageCategory.Boreprofile],
              languages: ['de'],
              label: 'BS1',
            },
          ],
        },
      });
      expect(mockPrismaService.assetLanguage.createMany).toHaveBeenCalledWith({
        data: [{ assetId: 'asset-1', languageItemCode: 'DE' }],
        skipDuplicates: true,
      });
    });
  });
});
