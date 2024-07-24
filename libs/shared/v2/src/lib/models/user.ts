import { Data, Model } from './base/model';
import { getRoleIndex, Role, WorkgroupId } from './workgroup';

export interface User extends Model<UserId> {
  email: string;
  lang: string;
  isAdmin: boolean;

  /**
   * The user's roles, mapped by the id of the workgroup to which they apply.
   */
  roles: Map<WorkgroupId, Role>;
}

export type UserId = string;
export type UserData = Omit<Data<User>, 'email'>;

const hasRole = (role: Role) => (user: User | null | undefined, workgroupId?: WorkgroupId) => {
  if (user == null) {
    return false;
  }
  if (user.isAdmin) {
    return true;
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

export const isMasterEditor = hasRole(Role.MasterEditor);
export const isEditor = hasRole(Role.Editor);
