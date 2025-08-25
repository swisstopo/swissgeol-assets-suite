import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsString } from 'class-validator';
import {
  AssetFile,
  AssetFileId,
  FileProcessingStage,
  FileProcessingState,
  LegalDocCode,
  PageClassification,
  UpdateAssetFileData,
} from '../models/asset-file';
import { IsNullable } from '../utils/class-validator/is-nullable.decorator';
import { Schema } from './base/schema';

export class AssetFileSchema extends Schema implements AssetFile {
  @IsInt()
  id!: AssetFileId;

  @IsString()
  name!: string;

  @IsString()
  alias!: string;

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

  @IsEnum(FileProcessingState)
  fileProcessingState!: FileProcessingState;

  @IsEnum(FileProcessingStage)
  @IsNullable()
  fileProcessingStage!: FileProcessingStage | null;

  @IsNullable()
  pageClassifications!: PageClassification[] | null;
}

export class UpdateAssetFileDataSchema extends Schema implements UpdateAssetFileData {
  @IsInt()
  id!: AssetFileId;

  @IsNullable()
  @IsEnum(LegalDocCode)
  legalDocCode!: LegalDocCode;
}
