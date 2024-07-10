import { IsArray, IsBoolean, IsString } from 'class-validator';
import { UserData, WorkgroupOnUser } from '../models/user';

export class UserDataSchema implements UserData {
  @IsString()
  lang!: string;

  @IsArray()
  workgroups!: WorkgroupOnUser[];

  @IsBoolean()
  isAdmin!: boolean;
}
