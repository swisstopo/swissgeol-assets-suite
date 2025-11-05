/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * This test is only implemented to check whether the range extraction works as expected. Yes, it is a private method,
 * but it is simpler to just check the implementation directly than to mock the entire service and its dependencies.
 */

import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { FileExtractionService } from './file-extraction.service';
import { PrismaService } from '@/core/prisma.service';
import { PredictionSchema } from '@/features/assets/files/file-processors/file-extraction/extraction-service-generated.interfaces';
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
      const result: PredictionSchema = {
        filename: 'test.pdf',
        metadata: { page_count: 3, languages: ['de'] },
        pages: [
          {
            page_number: 1,
            predicted_class: 'Text',
            page_metadata: { language: 'de', is_frontpage: true },
          },
          {
            page_number: 2,
            predicted_class: 'Text',
            page_metadata: { language: 'de', is_frontpage: false },
          },
          {
            page_number: 3,
            predicted_class: 'Boreprofile',
            page_metadata: { language: 'fr', is_frontpage: false },
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.transformExtractionResultToPageClassifications(result.pages);

      expect(ranges).toEqual([
        { page: 1, categories: ['t'], languages: ['de'] },
        { page: 2, categories: ['t'], languages: ['de'] },
        { page: 3, categories: ['b'], languages: ['fr'] },
      ]);
    });

    it('should ignore non-existing categories', () => {
      const loggerWarnSpy = jest.spyOn<any, any>(service['logger'], 'warn').mockImplementation();
      const nonExistingCategoryName = 'NewNonExistingCategory';
      const result: PredictionSchema = {
        filename: 'test.pdf',
        metadata: { page_count: 3, languages: ['de'] },
        pages: [
          {
            page_number: 1,
            predicted_class: nonExistingCategoryName,
            page_metadata: { language: 'de', is_frontpage: true },
          },
        ],
      } as unknown as PredictionSchema;

      // @ts-expect-error - testing a private method
      const ranges = service.transformExtractionResultToPageClassifications(result.pages);

      expect(ranges).toEqual([{ page: 1, categories: [], languages: ['de'] }]);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        `Extraction API sent an unknown page classification (it will be ignored): '${nonExistingCategoryName}'`,
      );
    });
  });
});
