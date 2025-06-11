import { IsEnum, IsInt } from 'class-validator';
import { AssetContact, AssetContactRole, ContactId } from '../models/contact';
import { Schema } from './base/schema';

export class AssetContactSchema extends Schema implements AssetContact {
  @IsInt()
  id!: ContactId;

  @IsEnum(AssetContactRole)
  role!: AssetContactRole;
}
