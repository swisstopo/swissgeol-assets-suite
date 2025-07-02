import { Role as PrismaRole } from '@prisma/client';
import { SimpleUser } from '@swissgeol/ui-core';
import { Data, Model } from './base/model';
import { getRoleIndex, Role, WorkgroupId } from './workgroup';

export { SimpleUser };

export interface User extends Model<UserId> {
  email: string;
  lang: string;
  isAdmin: boolean;
  firstName: string;
  lastName: string;

  /**
   * The user's roles, mapped by the id of the workgroup to which they apply.
   */
  roles: Map<WorkgroupId, Role>;
}

export type UserId = string;
export type UserData = Omit<Data<User>, 'email'>;

export const hasRole = (role: Role) => (user: User | null | undefined, workgroupId?: WorkgroupId) => {
  if (user == null) {
    return false;
  }
  const roleIndex = getRoleIndex(role);
  if (workgroupId != null) {
    const role = user.roles.get(workgroupId);
    return role != null && getRoleIndex(role) >= roleIndex;
  }
  for (const userRole of user.roles.values()) {
    if (getRoleIndex(userRole) >= roleIndex) {
      return true;
    }
  }
  return false;
};

export const mapRoleToPrisma = (role: Role): PrismaRole => {
  return role as PrismaRole;
};

export const mapRoleFromPrisma = (role: PrismaRole): Role => {
  return role as Role;
};

export const isEditor = hasRole(Role.Editor);
export const isReviewer = hasRole(Role.Reviewer);
export const isPublisher = hasRole(Role.Publisher);
