import { AssetFile } from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';

type SelectedAssetFile = Prisma.FileGetPayload<{ select: typeof assetFileSelection }>;

export const assetFileSelection = {
  id: true,
  name: true,
  nameAlias: true,
  size: true,
  type: true,
  legalDocItemCode: true,
  pageCount: true,
  lastModifiedAt: true,
} satisfies Prisma.FileSelect;

export const mapAssetFileFromPrisma = (data: SelectedAssetFile): AssetFile => ({
  id: data.id,
  name: data.name,
  alias: data.nameAlias,
  type: data.type,
  size: data.size,
  pageCount: data.pageCount,
  legalDocCode: data.legalDocItemCode,
  lastModifiedAt: data.lastModifiedAt,
});
