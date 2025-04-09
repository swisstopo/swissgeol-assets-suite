import { Favorite, UserId } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/core/prisma.service';
import { CreateRepo, DeleteRepo, ReadRepo, RepoListOptions } from '@/core/repo';
import { satisfy } from '@/utils/define';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class FavoriteRepo implements ReadRepo<Favorite, Favorite>, CreateRepo<Favorite>, DeleteRepo<Favorite> {
  constructor(private readonly prisma: PrismaService) {}

  async find(favorite: Favorite): Promise<Favorite | null> {
    const entry = await this.prisma.favorite.findUnique({
      where: {
        userId_assetId: mapFavoriteToId(favorite),
      },
      select: favoriteSelection,
    });
    return entry == null ? null : parse(entry);
  }

  async list({ limit, offset, ids }: RepoListOptions<Favorite> = {}): Promise<Favorite[]> {
    const entries = await this.prisma.favorite.findMany({
      where:
        ids == null
          ? undefined
          : {
              OR: ids.map(mapFavoriteToId),
            },
      select: favoriteSelection,
      take: limit,
      skip: offset,
    });
    return await Promise.all(entries.map(parse));
  }

  async listByUserId(userId: UserId): Promise<Favorite[]> {
    const entries = await this.prisma.favorite.findMany({
      where: {
        userId: userId,
      },
      select: favoriteSelection,
    });
    return await Promise.all(entries.map(parse));
  }

  async create(favorite: Favorite): Promise<Favorite> {
    try {
      const entry = await this.prisma.favorite.create({
        data: {
          ...mapFavoriteToId(favorite),
        },
        select: favoriteSelection,
      });
      return parse(entry);
    } catch (e) {
      // If the favorite already exists, we simply return it.
      // See https://www.prisma.io/docs/orm/reference/error-reference#p2002.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return favorite;
      }
      throw e;
    }
  }

  async delete(favorite: Favorite): Promise<boolean> {
    try {
      await this.prisma.favorite.delete({
        where: {
          userId_assetId: mapFavoriteToId(favorite),
        },
      });
      return true;
    } catch (e) {
      return handlePrismaMutationError(e) ?? false;
    }
  }
}

const favoriteSelection = satisfy<Prisma.FavoriteSelect>()({
  userId: true,
  assetId: true,
});

type SelectedFavorite = Prisma.FavoriteGetPayload<{ select: typeof favoriteSelection }>;

const parse = (data: SelectedFavorite): Favorite => ({
  assetId: data.assetId,
  userId: data.userId,
});

const mapFavoriteToId = (favorite: Favorite): Prisma.FavoriteUserIdAssetIdCompoundUniqueInput => ({
  userId: favorite.userId,
  assetId: favorite.assetId,
});
