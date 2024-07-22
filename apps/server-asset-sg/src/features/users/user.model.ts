import { Role as PrismaRole } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsString } from 'class-validator';
import { Data, Model } from '@/utils/data/model';

export interface User extends Model<UserId> {
  email: string;
  role: Role;
  lang: string;
  workgroups: WorkgroupOnUser[];
  isAdmin: boolean;
}

export interface WorkgroupOnUser {
  workgroupId: number;
  role: PrismaRole;
  workgroup: {
    name: string;
  };
}

export type UserId = string;
export type UserData = Omit<Data<User>, 'email'>;

export enum Role {
  Admin = 'admin',
  Editor = 'editor',
  MasterEditor = 'master-editor',
  Viewer = 'viewer',
}

export class UserDataBoundary implements UserData {
  @IsEnum(Role, { each: true })
  role!: Role;

  @IsString()
  lang!: string;

  @IsArray()
  workgroups!: WorkgroupOnUser[];

  @IsBoolean()
  isAdmin!: boolean;
}

export const getRoleIndex = (role: Role): number => {
  switch (role) {
    case Role.Admin:
      return 4;
    case Role.Editor:
      return 3;
    case Role.MasterEditor:
      return 2;
    case Role.Viewer:
      return 1;
  }
};
