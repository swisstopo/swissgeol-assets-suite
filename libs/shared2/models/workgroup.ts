import { Role as PrismaRole } from '@prisma/client';
import { AssetId } from '@shared/models/asset';
import { Data, Model } from '@shared/models/base/model';
import { UserId } from '@shared/models/user';
import { IsNullable } from '@shared/utils/class-validator/is-nullable.decorator';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsString } from 'class-validator';

export interface Workgroup extends Model<WorkgroupId> {
  name: string;
  assets?: { assetId: AssetId }[];
  users?: UserOnWorkgroup[];
  disabled_at: Date | null;
}

export type WorkgroupId = number;
export type WorkgroupData = Data<Workgroup>;

export interface UserOnWorkgroup {
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