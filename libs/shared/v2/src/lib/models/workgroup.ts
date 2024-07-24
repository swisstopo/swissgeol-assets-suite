import { Role as PrismaRole } from '@prisma/client';
import { Data, Model } from './base/model';
import { UserId } from './user';

export interface Workgroup extends Model<WorkgroupId> {
  name: string;
  users: Map<UserId, UserOnWorkgroup>;
  disabledAt: Date | null;
}

export interface UserOnWorkgroup {
  email: string;
  role: Role;
}

export type WorkgroupId = number;
export type WorkgroupData = Omit<Data<Workgroup>, 'assets'>;
export type SimpleWorkgroup = Pick<Workgroup, 'id' | 'name'> & {
  /**
   * The role of the current user within this workgroup.
   * Note that admins are registered as {@link Role.MasterEditor} for every workgroup.
   */
  role: Role;
};

export type Role = PrismaRole;
export const Role = PrismaRole;

export const getRoleIndex = (role: Role): number => {
  switch (role) {
    case 'Viewer':
      return 0;
    case 'Editor':
      return 1;
    case 'MasterEditor':
      return 2;
  }
};
