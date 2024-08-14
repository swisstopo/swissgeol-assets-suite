import { Role, SimpleWorkgroup, User, UserId, WorkgroupId } from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { ReadRepo, RepoListOptions } from '@/core/repo';
import { satisfy } from '@/utils/define';

export class SimpleWorkgroupRepo implements ReadRepo<SimpleWorkgroup, WorkgroupId> {
  constructor(private readonly prisma: PrismaService, private readonly user: User) {}

  async find(id: WorkgroupId): Promise<SimpleWorkgroup | null> {
    const entry = await this.prisma.workgroup.findFirst({
      where: { id, users: this.user.isAdmin ? undefined : { some: { userId: this.user.id } } },
      select: simpleWorkgroupSelection(this.user.id),
    });
    return entry == null ? null : parse(entry, this.user.isAdmin);
  }

  async list({ limit, offset, ids }: RepoListOptions<WorkgroupId> = {}): Promise<SimpleWorkgroup[]> {
    const isAnonymousMode = process.env.ANONYMOUS_MODE === 'true';
    const unrestricted = isAnonymousMode || this.user.isAdmin;
    const entries = await this.prisma.workgroup.findMany({
      where: {
        id: ids == null ? undefined : { in: ids },
        users: unrestricted ? undefined : { some: { userId: this.user.id } },
      },
      take: limit,
      skip: offset,
      select: simpleWorkgroupSelection(this.user.id),
    });
    return entries.map((it) => parse(it, this.user.isAdmin, isAnonymousMode));
  }
}

export const simpleWorkgroupSelection = (userId: UserId) =>
  satisfy<Prisma.WorkgroupSelect>()({
    id: true,
    name: true,
    users: {
      where: {
        userId,
      },
      select: {
        role: true,
      },
    },
  });

type SelectedWorkgroup = Prisma.WorkgroupGetPayload<{ select: ReturnType<typeof simpleWorkgroupSelection> }>;

const parse = (data: SelectedWorkgroup, isAdmin: boolean, isAnonymousMode = false): SimpleWorkgroup => {
  let role: Role;
  if (isAdmin) {
    role = Role.MasterEditor;
  } else if (isAnonymousMode) {
    role = Role.Viewer;
  } else {
    role = data.users[0].role;
  }
  return {
    id: data.id,
    name: data.name,
    role,
  };
};
