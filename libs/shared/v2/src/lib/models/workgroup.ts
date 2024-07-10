import { Role as PrismaRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsString } from 'class-validator';
import { IsNullable } from '../utils/class-validator/is-nullable.decorator';
import { AssetId } from './asset';
import { Data, Model } from './base/model';
import { UserId } from './user';

export interface Workgroup extends Model<WorkgroupId> {
  name: string;

  // TODO change this to `AssetId[]`
  assets?: { assetId: AssetId }[];
  users?: UserOnWorkgroup[];

  // TODO make this camel case
  disabled_at: Date | null;
}

export type WorkgroupId = number;
export type WorkgroupData = Data<Workgroup>;
export type SimpleWorkgroup = Pick<Workgroup, 'id' | 'name'> & {
  /**
   * The role of the current within this workgroup.
   * Note that admins are registered as {@link Role.MasterEditor} for every workgroup.
   */
  role: Role;
};

export interface UserOnWorkgroup {
  // TODO change this to `id`
  userId: UserId;
  role: Role;
}

export class WorkgroupDataBoundary implements WorkgroupData {
  @IsString()
  name!: string;

  @IsArray()
  assets?: { assetId: AssetId }[];

  @IsArray()
  users?: UserOnWorkgroup[];

  @IsDate()
  @IsNullable()
  @Type(() => Date)
  disabled_at!: Date | null;
}

export type Role = PrismaRole;
export const Role = PrismaRole;

export const getRoleIndex = (role: Role): number => {
  switch (role) {
    case 'Viewer':
      return 0;
    case 'Editor':
      return 1;
    case 'MasterEditor':
      return 2;
  }
};
