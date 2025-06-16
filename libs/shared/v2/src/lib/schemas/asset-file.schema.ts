import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsString } from 'class-validator';
import { AssetFile, AssetFileId, AssetFileType, LegalDocCode } from '../models/asset-file';
import { IsNullable } from '../utils/class-validator/is-nullable.decorator';
import { Schema } from './base/schema';

export class AssetFileSchema extends Schema implements AssetFile {
  @IsInt()
  id!: AssetFileId;

  @IsString()
  name!: string;

  @IsString()
  alias!: string;

  @IsEnum(AssetFileType)
  type!: AssetFileType;

  @IsInt()
  size!: number;

  @IsInt()
  pageCount!: number;

  @IsNullable()
  @IsEnum(LegalDocCode)
  legalDocCode!: LegalDocCode;

  @IsDate()
  @Type(() => Date)
  lastModifiedAt!: Date;
}
