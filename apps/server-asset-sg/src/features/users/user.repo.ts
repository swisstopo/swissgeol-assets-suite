import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/core/prisma.service';
import { Repo, RepoListOptions } from '@/core/repo';
import { Role, User, UserData, UserId } from '@/features/users/user.model';
import { satisfy } from '@/utils/define';
import { handlePrismaMutationError } from '@/utils/prisma';


@Injectable()
export class UserRepo implements Repo<User, UserId, UserData & { oidcId: string }, UserData> {
  constructor(
    private readonly prisma: PrismaService,
  ) {
  }

  async find(id: UserId): Promise<User | null> {
    const entry = await this.prisma.assetUser.findFirst({
      where: { id },
      select: userSelection,
    });
    return entry == null
      ? null
      : parse(entry);
  }

  async findByEmail(email: string): Promise<User | null> {
    const entry = await this.prisma.assetUser.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: userSelection,
    });
    return entry == null
      ? null
      : parse(entry);
  }

  async list({ limit, offset, ids }: RepoListOptions<UserId> = {}): Promise<User[]> {
    const entries = await this.prisma.assetUser.findMany({
      where: ids == null ? undefined : {
        id: { in: ids },
      },
      select: userSelection,
      take: limit,
      skip: offset,
    });
    return entries.map(parse);
  }

  async create(data: UserData & { oidcId: string, email: string }): Promise<User> {
    const entry = await this.prisma.assetUser.create({
      data: {
        id: data.oidcId,
        oidcId: data.oidcId,
        email: data.email,
        role: data.role,
        lang: data.lang,
      },
      select: userSelection,
    });
    return parse(entry);
  }

  async update(id: UserId, data: UserData): Promise<User | null> {
    try {
      const entry = await this.prisma.assetUser.update({
        where: { id },
        data: {
          role: data.role,
          lang: data.lang,
        },
        select: userSelection,
      });
      return parse(entry);
    } catch (e) {
      return handlePrismaMutationError(e);
    }
  }

  async delete(id: UserId): Promise<boolean> {
    try {
      await this.prisma.$transaction(async () => {
        // The schema does not define how to handle deletes on users with existing favourites,
        // so we need to delete them manually.
        await this.prisma.assetUserFavourite.deleteMany({ where: { assetUserId: id } });
        await this.prisma.assetUser.delete({ where: { id } });
      });
      return true;
    } catch (e) {
      return handlePrismaMutationError(e) ?? false;
    }
  }
}

const userSelection = satisfy<Prisma.AssetUserSelect>()({
  id: true,
  role: true,
  email: true,
  lang: true,
});

type SelectedUser = Prisma.AssetUserGetPayload<{ select: typeof userSelection }>;

const parse = (data: SelectedUser): User => ({
  ...data,
  role: data.role as Role,
});
