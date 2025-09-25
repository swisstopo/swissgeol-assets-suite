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

  describe('createPageRanges', () => {
    it('should create correct ranges from extraction result', () => {
      const result = {
        filename: 'test.pdf',
        metadata: { page_count: 3, languages: ['de'] },
        pages: [
          {
            page: 1,
            classification: { Text: 1, Boreprofile: 0, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'de', is_frontpage: true },
          },
          {
            page: 2,
            classification: { Text: 1, Boreprofile: 0, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'de', is_frontpage: false },
          },
          {
            page: 3,
            classification: { Text: 0, Boreprofile: 1, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'fr', is_frontpage: false },
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.createPageRanges(result);

      expect(ranges).toEqual([
        { from: 1, to: 2, categories: ['t'], languages: ['de'] },
        { from: 3, to: 3, categories: ['b'], languages: ['fr'] },
      ]);
    });

    it('should handle multiple categories on a single page', () => {
      const result = {
        filename: 'multi.pdf',
        metadata: { page_count: 1, languages: ['en'] },
        pages: [
          {
            page: 1,
            classification: { Text: 1, Boreprofile: 1, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'en', is_frontpage: true },
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.createPageRanges(result);

      expect(ranges).toEqual([{ from: 1, to: 1, categories: ['b', 't'], languages: ['en'] }]);
    });

    it('should split ranges if languages differ but categories are same', () => {
      const result = {
        filename: 'langs.pdf',
        metadata: { page_count: 2, languages: ['de', 'fr'] },
        pages: [
          {
            page: 1,
            classification: { Text: 1, Boreprofile: 0, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'de', is_frontpage: true },
          },
          {
            page: 2,
            classification: { Text: 1, Boreprofile: 0, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'fr', is_frontpage: false },
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.createPageRanges(result);

      expect(ranges).toEqual([
        { from: 1, to: 1, categories: ['t'], languages: ['de'] },
        { from: 2, to: 2, categories: ['t'], languages: ['fr'] },
      ]);
    });

    it('should handle pages with no language', () => {
      const result = {
        filename: 'nolangs.pdf',
        metadata: { page_count: 2, languages: [] },
        pages: [
          {
            page: 1,
            classification: { Text: 1, Boreprofile: 0, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: null, is_frontpage: true },
          },
          {
            page: 2,
            classification: { Text: 1, Boreprofile: 0, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: null, is_frontpage: false },
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.createPageRanges(result);

      expect(ranges).toEqual([{ from: 1, to: 2, categories: ['t'], languages: [] }]);
    });

    it('should split ranges if categories change even if language stays the same', () => {
      const result = {
        filename: 'categories.pdf',
        metadata: { page_count: 3, languages: ['it'] },
        pages: [
          {
            page: 1,
            classification: { Text: 1, Boreprofile: 0, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'it', is_frontpage: true },
          },
          {
            page: 2,
            classification: { Text: 1, Boreprofile: 1, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'it', is_frontpage: false },
          },
          {
            page: 3,
            classification: { Text: 1, Boreprofile: 0, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'it', is_frontpage: false },
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.createPageRanges(result);

      expect(ranges).toEqual([
        { from: 1, to: 1, categories: ['t'], languages: ['it'] },
        { from: 2, to: 2, categories: ['b', 't'], languages: ['it'] },
        { from: 3, to: 3, categories: ['t'], languages: ['it'] },
      ]);
    });

    it('should ignore order of elements', () => {
      const result = {
        filename: 'categories.pdf',
        metadata: { page_count: 3, languages: ['it'] },
        pages: [
          {
            page: 1,
            classification: { Boreprofile: 1, Text: 1, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'it', is_frontpage: false },
          },
          {
            page: 2,
            classification: { Text: 1, Boreprofile: 1, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'it', is_frontpage: false },
          },
          {
            page: 3,
            classification: { Text: 1, Boreprofile: 0, Maps: 0, Title_Page: 0, Unknown: 0 },
            metadata: { language: 'it', is_frontpage: false },
          },
        ],
      };

      // @ts-expect-error - testing a private method
      const ranges = service.createPageRanges(result);

      expect(ranges).toEqual([
        { from: 1, to: 2, categories: ['b', 't'], languages: ['it'] },
        { from: 3, to: 3, categories: ['t'], languages: ['it'] },
      ]);
    });
  });
});
