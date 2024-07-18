import { Data, Model } from '@shared/models/base/model';
import { getRoleIndex, Role, WorkgroupId } from '@shared/models/workgroup';

export interface User extends Model<UserId> {
  email: string;
  lang: string;
  workgroups: WorkgroupOnUser[];
  isAdmin: boolean;
}

export interface WorkgroupOnUser {
  id: WorkgroupId;
  role: Role;
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
  if (workgroupId == null) {
    return null != user.workgroups.find((it) => getRoleIndex(it.role) >= roleIndex);
  }
  for (const workgroup of user.workgroups) {
    if (workgroup.id != workgroupId) {
      continue;
    }
    return getRoleIndex(workgroup.role) >= roleIndex;
  }
  return false;
};

export const isMasterEditor = hasRole(Role.MasterEditor);
export const isEditor = hasRole(Role.Editor);
