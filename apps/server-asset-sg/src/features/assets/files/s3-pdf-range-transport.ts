import { Readable } from 'node:stream';
import { Logger } from '@nestjs/common';
import { PDFDataRangeTransport } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { FileS3Service } from '@/features/assets/files/file-s3.service';

/**
 * Custom PDFDataRangeTransport that uses the S3 SDK for byte-range requests
 * instead of letting pdfjs-dist do its own fetch() (which leaks promises and memory).
 */
export class S3PdfRangeTransport extends PDFDataRangeTransport {
  private readonly logger = new Logger(S3PdfRangeTransport.name);
  private aborted = false;

  constructor(
    length: number,
    initialData: Uint8Array | null,
    private readonly fileName: string,
    private readonly fileS3Service: FileS3Service,
  ) {
    super(length, initialData, initialData !== null);
  }

  override requestDataRange(begin: number, end: number): void {
    if (this.aborted) return;
    this.fetchRange(begin, end).catch((err) => {
      if (!this.aborted) {
        this.logger.warn('S3 range request failed', {
          fileName: this.fileName,
          begin,
          end,
          error: err instanceof Error ? err.message : String(err),
        });
        // ponytail: deliver null chunk to signal error to pdfjs-dist
        this.onDataRange(begin, null);
      }
    });
  }

  override abort(): void {
    this.aborted = true;
  }

  private async fetchRange(begin: number, end: number): Promise<void> {
    // HTTP Range is inclusive on both ends: bytes=begin-(end-1)
    const rangeHeader = `bytes=${begin}-${end - 1}`;
    const result = await this.fileS3Service.load(this.fileName, rangeHeader);
    if (result === null || this.aborted) return;

    const chunks: Buffer[] = [];
    for await (const chunk of result.content as Readable) {
      if (this.aborted) return;
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (this.aborted) return;
    this.onDataRange(begin, new Uint8Array(Buffer.concat(chunks)));
  }
}

/**
 * Creates an S3PdfRangeTransport for a given file.
 * Returns null if the file doesn't exist in S3 or has no known size.
 */
export async function createS3PdfTransport(
  fileName: string,
  fileS3Service: FileS3Service,
): Promise<S3PdfRangeTransport | null> {
  const metadata = await fileS3Service.loadMetadata(fileName);
  if (metadata === null || metadata.byteCount === null || metadata.byteCount === 0) {
    return null;
  }
  return new S3PdfRangeTransport(metadata.byteCount, null, fileName, fileS3Service);
}
