import { IsArray, IsBoolean, IsString } from 'class-validator';
import { Role } from '@/features/workgroups/workgroup.model';
import { Data, Model } from '@/utils/data/model';

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

export class UserDataBoundary implements UserData {
  @IsString()
  lang!: string;

  @IsArray()
  workgroups!: WorkgroupOnUser[];

  @IsBoolean()
  isAdmin!: boolean;
}
