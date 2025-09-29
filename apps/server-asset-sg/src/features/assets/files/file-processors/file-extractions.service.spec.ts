/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * This test is only implemented to check whether the range extraction works as expected. Yes, it is a private method,
 * but it is simpler to just check the implementation directly than to mock the entire service and its dependencies.
 */

import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { ExtractionResult, FileExtractionService } from './file-extraction.service';
import { PrismaService } from '@/core/prisma.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';

describe('FileExtractionService', () => {
  let service: FileExtractionService;

  const mockFileS3Service = {};
  const mockPrismaService = {};
  const mockEventEmitter = { emit: jest.fn() };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
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

  describe('transformExtractionResultToPageClassifications', () => {
    it('should create correct pages from extraction result', () => {
      const result: ExtractionResult = {
        filename: 'test.pdf',
        metadata: { page_count: 3, languages: ['de'] },
        pages: [
          {
            page: 1,
            classification: {
              Text: 1,
              Boreprofile: 0,
              Map: 0,
              TitlePage: 0,
              Unknown: 0,
              Diagram: 0,
              GeoProfile: 0,
              Table: 0,
            },
            metadata: { language: 'de', is_frontpage: true },
          },
          {
            page: 2,
            classification: {
              Text: 1,
              Boreprofile: 0,
              Map: 0,
              TitlePage: 0,
              Unknown: 0,
              Diagram: 0,
              GeoProfile: 0,
              Table: 0,
            },
            metadata: { language: 'de', is_frontpage: false },
          },
          {
            page: 3,
            classification: {
              Text: 0,
              Boreprofile: 1,
              Map: 0,
              TitlePage: 0,
              Unknown: 0,
              Diagram: 0,
              GeoProfile: 0,
              Table: 0,
            },
            metadata: { language: 'fr', is_frontpage: false },
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.transformExtractionResultToPageClassifications(result);

      expect(ranges).toEqual([
        { page: 1, categories: ['t'], languages: ['de'] },
        { page: 2, categories: ['t'], languages: ['de'] },
        { page: 3, categories: ['b'], languages: ['fr'] },
      ]);
    });

    it('should ignore non-existing categories', () => {
      const loggerWarnSpy = jest.spyOn<any, any>(service['logger'], 'warn').mockImplementation();
      const nonExistingCategoryName = 'NewNonExistingCategory';
      const result: ExtractionResult = {
        filename: 'test.pdf',
        metadata: { page_count: 3, languages: ['de'] },
        pages: [
          {
            page: 1,
            classification: {
              [nonExistingCategoryName]: 1,
            },
            metadata: { language: 'de', is_frontpage: true },
          },
        ],
      } as unknown as ExtractionResult;

      // @ts-expect-error - testing a private method
      const ranges = service.transformExtractionResultToPageClassifications(result);

      expect(ranges).toEqual([{ page: 1, categories: [], languages: ['de'] }]);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        `Extraction API sent an unknown page classification (it will be ignored): '${nonExistingCategoryName}'`,
      );
    });
  });
});
