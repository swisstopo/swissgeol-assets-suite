/* eslint-disable @typescript-eslint/no-empty-function */

import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PdfMetadataService } from './pdf-metadata.service';

// Mock pdfjs-dist to avoid ES module import.meta issues in Jest
jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn(),
}));

// Import after mocking
const pdfjsMock = require('pdfjs-dist/legacy/build/pdf.mjs');

describe('PdfMetadataService', () => {
  let service: PdfMetadataService;
  let mockGetDocument: jest.MockedFunction<any>;

  beforeAll(() => {
    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfMetadataService],
    }).compile();

    service = module.get<PdfMetadataService>(PdfMetadataService);
    mockGetDocument = pdfjsMock.getDocument;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('extractMetadata', () => {
    it('should handle PDFs with different page sizes', async () => {
      // Given: A PDF with pages of different sizes (portrait and landscape)
      const mockPage1 = {
        getViewport: jest.fn().mockReturnValue({ width: 595.28, height: 841.89 }), // A4 portrait
        cleanup: jest.fn(),
      };
      const mockPage2 = {
        getViewport: jest.fn().mockReturnValue({ width: 841.89, height: 595.28 }), // A4 landscape
        cleanup: jest.fn(),
      };
      const mockPage3 = {
        getViewport: jest.fn().mockReturnValue({ width: 612, height: 792 }), // US Letter
        cleanup: jest.fn(),
      };

      const mockDoc = {
        numPages: 3,
        getPage: jest
          .fn()
          .mockResolvedValueOnce(mockPage1)
          .mockResolvedValueOnce(mockPage2)
          .mockResolvedValueOnce(mockPage3),
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockDoc as any),
      } as any);

      // When: Extracting metadata
      const result = await service.extractMetadata('https://example.com/mixed.pdf');

      // Then: Should return dimensions for each page
      expect(result).toEqual({
        pageCount: 3,
        pageDimensions: [
          { page: 1, width: 595.28, height: 841.89 },
          { page: 2, width: 841.89, height: 595.28 },
          { page: 3, width: 612, height: 792 },
        ],
      });
    });

    it('should use fallback dimensions when individual page extraction fails', async () => {
      // Given: A PDF where page 2 fails to extract
      const mockPage1 = {
        getViewport: jest.fn().mockReturnValue({ width: 595.28, height: 841.89 }),
        cleanup: jest.fn(),
      };
      const mockPage3 = {
        getViewport: jest.fn().mockReturnValue({ width: 595.28, height: 841.89 }),
        cleanup: jest.fn(),
      };

      const mockDoc = {
        numPages: 3,
        getPage: jest
          .fn()
          .mockResolvedValueOnce(mockPage1)
          .mockRejectedValueOnce(new Error('Page extraction failed'))
          .mockResolvedValueOnce(mockPage3),
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockDoc as any),
      } as any);

      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      // When: Extracting metadata
      const result = await service.extractMetadata('https://example.com/partial-fail.pdf');

      // Then: Should use fallback dimensions for failed page
      expect(result).toEqual({
        pageCount: 3,
        pageDimensions: [
          { page: 1, width: 595.28, height: 841.89 },
          { page: 2, width: 595.28, height: 841.89 }, // Fallback A4 dimensions
          { page: 3, width: 595.28, height: 841.89 },
        ],
      });

      // Verify warning was logged
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to extract dimensions for page 2',
        expect.objectContaining({
          error: expect.any(Error),
          fileUrl: 'https://example.com/partial-fail.pdf',
        }),
      );
    });

    it('should throw error when PDF document fails to load', async () => {
      // Given: A PDF that fails to load
      mockGetDocument.mockReturnValue({
        promise: Promise.reject(new Error('Invalid PDF file')),
      } as any);

      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      // When/Then: Should throw error
      await expect(service.extractMetadata('https://example.com/invalid.pdf')).rejects.toThrow(
        'PDF metadata extraction failed: Invalid PDF file',
      );

      // Verify error was logged
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to extract PDF metadata',
        expect.objectContaining({
          error: expect.any(Error),
          fileUrl: 'https://example.com/invalid.pdf',
        }),
      );
    });

    it('should handle invalid URLs gracefully', async () => {
      // Given: An invalid URL
      const invalidUrl = 'not-a-valid-url';

      const mockDoc = {
        numPages: 1,
        getPage: jest.fn().mockResolvedValue({
          getViewport: jest.fn().mockReturnValue({ width: 595.28, height: 841.89 }),
          cleanup: jest.fn(),
        }),
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockGetDocument.mockReturnValue({
        promise: Promise.resolve(mockDoc as any),
      } as any);

      const debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();

      // When: Extracting metadata
      await service.extractMetadata(invalidUrl);

      // Then: Should use fallback URL representation in logs
      expect(debugSpy).toHaveBeenCalledWith(
        'Starting PDF metadata extraction',
        expect.objectContaining({
          fileUrl: '[invalid-url]',
        }),
      );
    });
  });
});
