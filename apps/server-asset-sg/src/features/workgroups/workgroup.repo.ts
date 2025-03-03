import { User, UserId, UserOnWorkgroup, Workgroup, WorkgroupData, WorkgroupId } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { Repo, RepoListOptions } from '@/core/repo';
import { SimpleWorkgroupRepo } from '@/features/workgroups/workgroup-simple.repo';
import { satisfy } from '@/utils/define';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class WorkgroupRepo implements Repo<Workgroup, WorkgroupId, WorkgroupData> {
  constructor(private readonly prisma: PrismaService) {}

  simple(user: User): SimpleWorkgroupRepo {
    return new SimpleWorkgroupRepo(this.prisma, user);
  }

  async find(id: WorkgroupId): Promise<Workgroup | null> {
    const entry = await this.prisma.workgroup.findUnique({
      where: { id },
      select: workgroupSelection,
    });
    return entry == null ? null : parse(entry);
  }

  async list({ limit, offset, ids }: RepoListOptions<WorkgroupId> = {}): Promise<Workgroup[]> {
    const entries = await this.prisma.workgroup.findMany({
      where: ids == null ? undefined : { id: { in: ids } },
      take: limit,
      skip: offset,
      select: workgroupSelection,
    });
    return entries.map(parse);
  }

  async create(data: WorkgroupData): Promise<Workgroup> {
    const entry = await this.prisma.workgroup.create({
      data: {
        name: data.name,
        created_at: new Date(),
        disabled_at: data.disabledAt,
        users: data.users
          ? {
              createMany: {
                data: [...data.users].map(([userId, user]) => ({
                  userId,
                  role: user.role,
                })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      select: workgroupSelection,
    });
    return parse(entry);
  }

  async update(id: WorkgroupId, data: WorkgroupData): Promise<Workgroup | null> {
    try {
      const entry = await this.prisma.workgroup.update({
        where: { id },
        data: {
          name: data.name,
          disabled_at: data.disabledAt,
          users: data.users
            ? {
                deleteMany: {
                  userId: {},
                },
                createMany: {
                  data: [...data.users].map(([userId, user]) => ({
                    userId: userId,
                    role: user.role,
                  })),
                  skipDuplicates: true,
                },
              }
            : undefined,
        },
        select: workgroupSelection,
      });
      return parse(entry);
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

export const workgroupSelection = satisfy<Prisma.WorkgroupSelect>()({
  id: true,
  name: true,
  disabled_at: true,
  users: {
    orderBy: {
      user: {
        email: 'asc',
      },
    },
    select: {
      role: true,
      user: {
        select: {
          email: true,
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  assets: {
    orderBy: {
      assetId: 'asc',
    },
    select: {
      assetId: true,
    },
  },
});

type SelectedWorkgroup = Prisma.WorkgroupGetPayload<{ select: typeof workgroupSelection }>;

const parse = (data: SelectedWorkgroup): Workgroup => {
  const users = new Map<UserId, UserOnWorkgroup>();
  for (const user of data.users) {
    users.set(user.user.id, {
      email: user.user.email,
      role: user.role,
      firstName: user.user.firstName,
      lastName: user.user.lastName,
    });
  }
  return {
    id: data.id,
    name: data.name,
    users,
    disabledAt: data.disabled_at,
    numberOfAssets: data.assets.length,
  };
};
