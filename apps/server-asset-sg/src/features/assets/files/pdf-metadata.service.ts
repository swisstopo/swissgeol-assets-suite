import * as path from 'path';
import { PageDimension } from '@asset-sg/shared/v2';
import { Injectable, Logger } from '@nestjs/common';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// eval('require') bypasses webpack's static require analysis so the path is resolved at runtime by Node.js.

const STANDARD_FONT_DATA_URL =
  path.join(path.dirname((eval('require') as NodeRequire).resolve('pdfjs-dist/package.json')), 'standard_fonts') +
  path.sep;

@Injectable()
export class PdfMetadataService {
  private readonly logger = new Logger(PdfMetadataService.name);

  /**
   * Extracts metadata from a PDF file including page count and dimensions for all pages,
   * using pdfjs-dist library
   *
   * @param fileUrl - Pre-signed URL or full path to the PDF file
   * @returns Metadata including page count and array of page dimensions
   */
  async extractMetadata(fileUrl: string): Promise<PdfMetadataResult> {
    let doc: PDFDocumentProxy | null = null;

    let loadingTask: PDFDocumentLoadingTask | null = null;
    try {
      this.logger.debug('Starting PDF metadata extraction', { fileUrl: this.sanitizeUrl(fileUrl) });

      loadingTask = getDocument({
        url: fileUrl,
        standardFontDataUrl: STANDARD_FONT_DATA_URL,
        disableAutoFetch: true,
        disableStream: false,
      });
      // Load the PDF document without fetching all pages
      doc = await loadingTask.promise;

      const pageCount = doc.numPages;
      const pageDimensions: PageDimension[] = [];

      // Extract dimensions for each page
      // This is lightweight - only fetches page structure, not rendering
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        try {
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1 });

          pageDimensions.push({
            page: pageNum,
            width: viewport.width,
            height: viewport.height,
          });

          // Clean up page resources immediately
          page.cleanup();
        } catch (pageError) {
          this.logger.warn(`Failed to extract dimensions for page ${pageNum}`, {
            error: pageError,
            fileUrl: this.sanitizeUrl(fileUrl),
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
        fileUrl: this.sanitizeUrl(fileUrl),
        pageCount,
        dimensionsExtracted: pageDimensions.length,
      });

      return { pageCount, pageDimensions };
    } catch (error) {
      this.logger.error('Failed to extract PDF metadata', {
        error,
        fileUrl: this.sanitizeUrl(fileUrl),
      });
      throw new Error(`PDF metadata extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Ensure PDF document is properly destroyed to free memory
      await loadingTask?.destroy();
    }
  }

  /**
   * Sanitizes URL for logging by removing query parameters (which may contain sensitive tokens)
   */
  private sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return '[invalid-url]';
    }
  }
}

export interface PdfMetadataResult {
  pageCount: number;
  pageDimensions: PageDimension[];
}
