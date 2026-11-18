import { LocalizedItemCode } from '@asset-sg/shared/v2';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';

/**
 * Asserts that all given file format codes exist.
 *
 * @throws HttpException with status 422 if at least one code is unknown.
 */
export const assertKnownFileFormats = async (
  prisma: PrismaService,
  formatCodes: Iterable<LocalizedItemCode>,
): Promise<void> => {
  const codes = [...new Set(formatCodes)];
  if (codes.length === 0) {
    return;
  }
  const existing = await prisma.assetFormatItem.findMany({
    where: { assetFormatItemCode: { in: codes } },
    select: { assetFormatItemCode: true },
  });
  if (existing.length !== codes.length) {
    throw new HttpException('Unknown file format', HttpStatus.UNPROCESSABLE_ENTITY);
  }
};
