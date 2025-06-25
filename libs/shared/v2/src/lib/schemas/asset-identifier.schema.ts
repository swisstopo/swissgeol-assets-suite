import { Transform } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';
import { AssetIdentifier, AssetIdentifierData, AssetIdentifierId } from '../models/asset-identifier';
import { Schema } from './base/schema';

export class AssetIdentifierDataSchema extends Schema implements AssetIdentifierData {
  @IsString()
  value!: string;

  @IsString()
  description!: string;
}

export class AssetIdentifierSchema extends AssetIdentifierDataSchema implements AssetIdentifier {
  @IsInt()
  id!: AssetIdentifierId;
}

export function TransformAssetIdentifier(options: { each?: boolean } = {}) {
  const transformSingle = (value: object) => {
    if ('id' in value) {
      return Object.assign(new AssetIdentifierSchema(), value);
    } else {
      return Object.assign(new AssetIdentifierDataSchema(), value);
    }
  };
  return options.each
    ? Transform(({ value }) => (value as object[]).map(transformSingle))
    : Transform(({ value }) => transformSingle(value));
}
