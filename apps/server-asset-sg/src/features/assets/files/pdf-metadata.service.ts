import * as path from 'node:path';
import { PageDimension } from '@asset-sg/shared/v2';
import { Injectable, Logger } from '@nestjs/common';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { FileS3Service } from '@/features/assets/files/file-s3.service';
import { createS3PdfTransport, S3PdfRangeTransport } from '@/features/assets/files/s3-pdf-range-transport';

// eval('require') bypasses webpack's static require analysis so the path is resolved at runtime by Node.js.
const STANDARD_FONT_DATA_URL =
  path.join(path.dirname((eval('require') as NodeRequire).resolve('pdfjs-dist/package.json')), 'standard_fonts') +
  path.sep;

@Injectable()
export class PdfMetadataService {
  private readonly logger = new Logger(PdfMetadataService.name);

  constructor(private readonly fileS3Service: FileS3Service) {}

  /**
   * Extracts metadata from a PDF file including page count and dimensions for all pages.
   *
   * @param fileName - S3 object name of the PDF file
   * @returns Metadata including page count and array of page dimensions
   */
  async extractMetadata(fileName: string): Promise<PdfMetadataResult> {
    let doc: PDFDocumentProxy | null = null;
    let transport: S3PdfRangeTransport | null = null;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    try {
      this.logger.debug('Starting PDF metadata extraction', { fileName });

      transport = await createS3PdfTransport(fileName, this.fileS3Service);
      if (transport === null) {
        throw new Error('File not found in S3 or has no size');
      }

      loadingTask = getDocument({
        range: transport,
        standardFontDataUrl: STANDARD_FONT_DATA_URL,
        disableAutoFetch: true,
        disableStream: false,
        verbosity: 0,
      });
      doc = await loadingTask.promise;

      const pageCount = doc.numPages;
      const pageDimensions: PageDimension[] = [];

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        try {
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1 });

          pageDimensions.push({
            page: pageNum,
            width: viewport.width,
            height: viewport.height,
          });

          page.cleanup();
        } catch (pageError) {
          this.logger.warn(`Failed to extract dimensions for page ${pageNum}`, {
            error: pageError,
            fileName,
          });

          // Use fallback dimensions (A4 portrait in points: 595.28 x 841.89)
          pageDimensions.push({
            page: pageNum,
            width: 595.28,
            height: 841.89,
          });
        }
      }

      this.logger.debug('PDF metadata extraction completed', {
        fileName,
        pageCount,
        dimensionsExtracted: pageDimensions.length,
      });

      return { pageCount, pageDimensions };
    } catch (error) {
      this.logger.error('Failed to extract PDF metadata', { error, fileName });
      throw new Error(`PDF metadata extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      transport?.abort();
      await loadingTask?.destroy();
    }
  }
}

export interface PdfMetadataResult {
  pageCount: number;
  pageDimensions: PageDimension[];
}
