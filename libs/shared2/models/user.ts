import { Data, Model } from '@shared/models/base/model';
import { Role } from '@shared/models/workgroup';

export interface User extends Model<UserId> {
  email: string;
  lang: string;
  workgroups: WorkgroupOnUser[];
  isAdmin: boolean;
}

export interface WorkgroupOnUser {
  id: number;
  role: Role;
}

export type UserId = string;
export type UserData = Omit<Data<User>, 'email'>;
