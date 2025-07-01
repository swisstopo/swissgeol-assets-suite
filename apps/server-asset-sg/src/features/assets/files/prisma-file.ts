import { AssetFile, LegalDocCode, OcrStatus } from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';

type SelectedAssetFile = Prisma.FileGetPayload<{ select: typeof assetFileSelection }>;

export const assetFileSelection = {
  id: true,
  name: true,
  nameAlias: true,
  size: true,
  legalDocItemCode: true,
  pageCount: true,
  lastModifiedAt: true,
  ocrStatus: true,
} satisfies Prisma.FileSelect;

export const mapAssetFileFromPrisma = (data: SelectedAssetFile): AssetFile => ({
  id: data.id,
  name: data.name,
  alias: data.nameAlias,
  pageCount: data.pageCount,
  legalDocCode: data.legalDocItemCode as LegalDocCode,
  lastModifiedAt: data.lastModifiedAt,
  ocrStatus: data.ocrStatus as OcrStatus,

  // `Number.MAX_SAFE_INTEGER` represents around 9000TBs of bytes, so there is really no reason to ever use `bigint` here.
  size: Number(data.size),
});
