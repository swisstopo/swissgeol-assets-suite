import { getRoleIndex, Role, SimpleUser } from '@swisstopo/swissgeol-ui-core';
import { Data, Model } from './base/model';
import { UserId } from './user';

export { SimpleUser, Role, getRoleIndex };

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
