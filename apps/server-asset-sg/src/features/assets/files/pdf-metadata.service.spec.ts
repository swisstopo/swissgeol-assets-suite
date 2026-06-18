/* eslint-disable @typescript-eslint/no-empty-function */

import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileS3Service } from './file-s3.service';
import { PdfMetadataService } from './pdf-metadata.service';

// Mock pdfjs-dist to avoid ES module import.meta issues in Jest
jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn(),
}));

// Mock the S3 transport so we don't need real S3
jest.mock('./s3-pdf-range-transport', () => ({
  createS3PdfTransport: jest.fn(),
  S3PdfRangeTransport: jest.fn(),
}));

// Import after mocking
const pdfjsMock = require('pdfjs-dist/legacy/build/pdf.mjs');
const transportMock = require('./s3-pdf-range-transport');

describe('PdfMetadataService', () => {
  let service: PdfMetadataService;
  let mockGetDocument: jest.MockedFunction<any>;
  let mockCreateTransport: jest.MockedFunction<any>;

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
      providers: [PdfMetadataService, { provide: FileS3Service, useValue: {} }],
    }).compile();

    service = module.get<PdfMetadataService>(PdfMetadataService);
    mockGetDocument = pdfjsMock.getDocument;
    mockCreateTransport = transportMock.createS3PdfTransport;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('extractMetadata', () => {
    it('should handle PDFs with different page sizes', async () => {
      const mockTransport = { abort: jest.fn() };
      mockCreateTransport.mockResolvedValue(mockTransport);

      const mockPage1 = {
        getViewport: jest.fn().mockReturnValue({ width: 595.28, height: 841.89 }),
        cleanup: jest.fn(),
      };
      const mockPage2 = {
        getViewport: jest.fn().mockReturnValue({ width: 841.89, height: 595.28 }),
        cleanup: jest.fn(),
      };
      const mockPage3 = {
        getViewport: jest.fn().mockReturnValue({ width: 612, height: 792 }),
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
        destroy: jest.fn().mockResolvedValue(undefined),
      } as any);

      const result = await service.extractMetadata('test-file.pdf');

      expect(result).toEqual({
        pageCount: 3,
        pageDimensions: [
          { page: 1, width: 595.28, height: 841.89 },
          { page: 2, width: 841.89, height: 595.28 },
          { page: 3, width: 612, height: 792 },
        ],
      });
      expect(mockGetDocument).toHaveBeenCalledWith(expect.objectContaining({ range: mockTransport }));
    });

    it('should use fallback dimensions when individual page extraction fails', async () => {
      const mockTransport = { abort: jest.fn() };
      mockCreateTransport.mockResolvedValue(mockTransport);

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
        destroy: jest.fn().mockResolvedValue(undefined),
      } as any);

      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const result = await service.extractMetadata('test-file.pdf');

      expect(result).toEqual({
        pageCount: 3,
        pageDimensions: [
          { page: 1, width: 595.28, height: 841.89 },
          { page: 2, width: 595.28, height: 841.89 },
          { page: 3, width: 595.28, height: 841.89 },
        ],
      });

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to extract dimensions for page 2',
        expect.objectContaining({
          error: expect.any(Error),
          fileName: 'test-file.pdf',
        }),
      );
    });

    it('should throw error when PDF document fails to load', async () => {
      const mockTransport = { abort: jest.fn() };
      mockCreateTransport.mockResolvedValue(mockTransport);

      mockGetDocument.mockReturnValue({
        promise: Promise.reject(new Error('Invalid PDF file')),
        destroy: jest.fn().mockResolvedValue(undefined),
      } as any);

      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await expect(service.extractMetadata('invalid.pdf')).rejects.toThrow(
        'PDF metadata extraction failed: Invalid PDF file',
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to extract PDF metadata',
        expect.objectContaining({
          error: expect.any(Error),
          fileName: 'invalid.pdf',
        }),
      );
    });

    it('should throw when transport creation returns null (file not in S3)', async () => {
      mockCreateTransport.mockResolvedValue(null);

      await expect(service.extractMetadata('missing.pdf')).rejects.toThrow(
        'PDF metadata extraction failed: File not found in S3 or has no size',
      );
    });
  });
});
