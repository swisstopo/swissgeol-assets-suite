import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsIn, IsInt, IsString, ValidateNested } from 'class-validator';
import {
  AssetFile,
  AssetFileId,
  FileProcessingStage,
  FileProcessingState,
  LegalDocCode,
  PageCategory,
  PageClassification,
  SupportedPageLanguage,
  SupportedPageLanguages,
  UpdateAssetFileData,
} from '../models/asset-file';
import { IsNullable } from '../utils/class-validator/is-nullable.decorator';
import { Schema } from './base/schema';

class PageClassificationSchema implements PageClassification {
  @IsInt()
  to!: number;
  @IsInt()
  from!: number;
  @IsIn(SupportedPageLanguages, { each: true })
  languages!: SupportedPageLanguage[];
  @IsEnum(PageCategory, { each: true })
  categories!: PageCategory[];
}

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
  @Type(() => PageClassificationSchema)
  @ValidateNested({ each: true })
  pageClassifications!: PageClassificationSchema[] | null;
}

export class UpdateAssetFileDataSchema extends Schema implements UpdateAssetFileData {
  @IsInt()
  id!: AssetFileId;

  @IsNullable()
  @IsEnum(LegalDocCode)
  legalDocCode!: LegalDocCode;

  @IsNullable()
  pageClassifications!: PageClassification[] | null;
}
