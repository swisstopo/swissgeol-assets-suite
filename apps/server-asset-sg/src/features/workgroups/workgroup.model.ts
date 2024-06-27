import { Role as PrismaRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsString } from 'class-validator';
import { IsNullable } from '@/core/decorators/is-nullable.decorator';
import { AssetId } from '@/features/assets/asset.model';
import { UserId } from '@/features/users/user.model';
import { Data, Model } from '@/utils/data/model';

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

export type Role = PrismaRole;
export const Role = PrismaRole;

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
