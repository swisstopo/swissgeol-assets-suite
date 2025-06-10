import { Role } from '@prisma/client';
import { Role as SgcRole, SimpleUser } from '@swisstopo/swissgeol-ui-core';
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { User, UserData, UserId } from '../models/user';
import { WorkgroupId } from '../models/workgroup';
import { Schema, TransformMap } from './base/schema';

export class UserDataSchema extends Schema implements UserData {
  @IsString()
  lang!: string;

  @IsBoolean()
  isAdmin!: boolean;

  // TODO: add @IsNotEmpty() to firstname and lastname once all users have them
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @TransformMap()
  @IsEnum(Role, { each: true })
  roles!: Map<WorkgroupId, Role>;
}

export class UserSchema extends UserDataSchema implements User {
  @IsString()
  id!: UserId;

  @IsString()
  email!: string;
}

export class SimpleUserSchema implements SimpleUser {
  @IsString()
  id!: UserId;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEnum(SgcRole)
  role!: SgcRole;
}
