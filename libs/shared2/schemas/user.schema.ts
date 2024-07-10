import { UserData, WorkgroupOnUser } from '@shared/models/user';
import { IsArray, IsBoolean, IsString } from 'class-validator';

export class UserDataSchema implements UserData {
  @IsString()
  lang!: string;

  @IsArray()
  workgroups!: WorkgroupOnUser[];

  @IsBoolean()
  isAdmin!: boolean;
}
