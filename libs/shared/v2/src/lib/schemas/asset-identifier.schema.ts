import { IsInt, IsString } from 'class-validator';
import { AssetIdentifier, AssetIdentifierId } from '../models/asset-old';
import { Schema } from './base/schema';

export class AssetIdentifierSchema extends Schema implements AssetIdentifier {
  @IsInt()
  id!: AssetIdentifierId;

  @IsString()
  name!: string;

  @IsString()
  description!: string;
}
