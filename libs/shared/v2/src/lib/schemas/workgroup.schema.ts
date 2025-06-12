import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsString, ValidateNested } from 'class-validator';
import { UserId } from '../models/user';
import { Role, UserOnWorkgroup, Workgroup, WorkgroupData, WorkgroupId } from '../models/workgroup';
import { IsNullable } from '../utils/class-validator/is-nullable.decorator';
import { Schema, TransformMap } from './base/schema';

export class WorkgroupDataSchema extends Schema implements WorkgroupData {
  @IsString()
  name!: string;

  @TransformMap()
  @ValidateNested({ each: true })
  @Type(() => UserOnWorkgroupSchema)
  users!: Map<UserId, UserOnWorkgroup>;

  @IsDate()
  @IsNullable()
  @Type(() => Date)
  disabledAt!: Date | null;
}

export class WorkgroupSchema extends WorkgroupDataSchema implements Workgroup {
  @IsNumber()
  id!: WorkgroupId;

  @IsNumber()
  numberOfAssets!: number;
}

export class UserOnWorkgroupSchema implements UserOnWorkgroup {
  @IsString()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEnum(Role)
  role!: Role;
}
