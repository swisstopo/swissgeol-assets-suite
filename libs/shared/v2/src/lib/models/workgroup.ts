import { Role as PrismaRole } from '@prisma/client';
import { Data, Model } from './base/model';
import { UserId } from './user';

export interface Workgroup extends Model<WorkgroupId> {
  name: string;
  users: Map<UserId, UserOnWorkgroup>;
  disabledAt: Date | null;
  numberOfAssets: number;
}

export interface UserOnWorkgroup {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

export type WorkgroupId = number;
export type WorkgroupData = Data<Omit<Workgroup, 'numberOfAssets'>>;
export type SimpleWorkgroup = Pick<Workgroup, 'id' | 'name'> & {
  /**
   * The role of the current user within this workgroup.
   * Note that admins are registered as {@link Role.Publisher} for every workgroup.
   */
  role: Role;
};

export type Role = PrismaRole;
export const Role = PrismaRole;

export const getRoleIndex = (role: Role): number => {
  switch (role) {
    case 'Reader':
      return 0;
    case 'Editor':
      return 1;
    case 'Reviewer':
      return 2;
    case 'Publisher':
      return 3;
  }
};
