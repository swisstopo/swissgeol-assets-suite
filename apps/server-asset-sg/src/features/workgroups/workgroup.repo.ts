import { Workgroup, WorkgroupData, WorkgroupId } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { Repo, RepoListOptions } from '@/core/repo';
import { satisfy } from '@/utils/define';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class WorkgroupRepo implements Repo<Workgroup, WorkgroupId, WorkgroupData> {
  constructor(private readonly prisma: PrismaService) {}

  find(id: WorkgroupId): Promise<Workgroup | null> {
    return this.prisma.workgroup.findUnique({
      where: { id },
      select: workGroupSelection,
    });
  }

  list({ limit, offset, ids }: RepoListOptions<WorkgroupId> = {}): Promise<Workgroup[]> {
    return this.prisma.workgroup.findMany({
      where: ids == null ? undefined : { id: { in: ids } },
      take: limit,
      skip: offset,
      select: workGroupSelection,
    });
  }

  create(data: WorkgroupData): Promise<Workgroup> {
    return this.prisma.workgroup.create({
      data: {
        name: data.name,
        created_at: new Date(),
        disabled_at: data.disabled_at,
        assets: {
          connect: data.assets?.map((asset) => ({ assetId: asset.assetId })),
        },
        users: data.users
          ? {
              createMany: {
                data: data.users.map((user) => ({
                  userId: user.userId,
                  role: user.role,
                })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      select: workGroupSelection,
    });
  }

  async update(id: WorkgroupId, data: WorkgroupData): Promise<Workgroup | null> {
    try {
      return await this.prisma.workgroup.update({
        where: { id },
        data: {
          name: data.name,
          disabled_at: data.disabled_at,
          assets: {
            set: data.assets ? data.assets.map((asset) => ({ assetId: asset.assetId })) : undefined,
          },
          users: data.users
            ? {
                deleteMany: {
                  userId: { notIn: data.users.map((user) => user.userId) },
                },
                createMany: {
                  data: data.users.map((user) => ({
                    userId: user.userId,
                    role: user.role,
                  })),
                  skipDuplicates: true,
                },
              }
            : undefined,
        },
        select: workGroupSelection,
      });
    } catch (e) {
      return handlePrismaMutationError(e);
    }
  }

  async delete(id: WorkgroupId): Promise<boolean> {
    try {
      await this.prisma.$transaction(async () => {
        await this.prisma.workgroupsOnUsers.deleteMany({ where: { workgroupId: id } });
        await this.prisma.workgroup.delete({ where: { id } });
      });
      return true;
    } catch (e) {
      return handlePrismaMutationError(e) ?? false;
    }
  }
}

export const workGroupSelection = satisfy<Prisma.WorkgroupSelect>()({
  id: true,
  name: true,
  disabled_at: true,
  users: {
    select: {
      userId: true,
      role: true,
    },
  },
  assets: {
    select: {
      assetId: true,
    },
  },
});
