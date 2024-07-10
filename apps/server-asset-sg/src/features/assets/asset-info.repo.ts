import { AssetId, AssetInfo } from '@shared/models/asset';
import { PrismaService } from '@/core/prisma.service';
import { ReadRepo, RepoListOptions } from '@/core/repo';
import { assetInfoSelection, parseAssetInfoFromPrisma } from '@/features/assets/prisma-asset';

export class AssetInfoRepo implements ReadRepo<AssetInfo, AssetId> {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: AssetId): Promise<AssetInfo | null> {
    const entry = await this.prisma.asset.findFirst({
      where: { assetId: id },
      select: assetInfoSelection,
    });
    return entry == null ? null : parseAssetInfoFromPrisma(entry);
  }

  async list({ limit, offset, ids }: RepoListOptions<AssetId> = {}): Promise<AssetInfo[]> {
    const entries = await this.prisma.asset.findMany({
      where:
        ids == null
          ? undefined
          : {
              assetId: { in: ids },
            },
      select: assetInfoSelection,
      take: limit,
      skip: offset,
    });
    return entries.map(parseAssetInfoFromPrisma);
  }
}
