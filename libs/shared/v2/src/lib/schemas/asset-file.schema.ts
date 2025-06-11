import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsString } from 'class-validator';
import { AssetFile, AssetFileId, AssetFileType } from '../models/asset-file';
import { LocalizedItemCode } from '../models/localized-item';
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

  @IsString()
  legalDocCode!: LocalizedItemCode;

  @IsDate()
  @Type(() => Date)
  lastModifiedAt!: Date;
}
