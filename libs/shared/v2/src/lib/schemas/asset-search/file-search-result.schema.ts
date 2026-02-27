import { Expose, Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { AssetId } from '../../models/asset';
import { AssetFileId } from '../../models/asset-file';
import { PageStats } from '../../models/asset-search/asset-search-result';
import { FileSearchResult, FileSearchResultItem } from '../../models/asset-search/file-search-result';
import { Schema } from '../base/schema';

export class FileSearchResultItemSchema extends Schema implements FileSearchResultItem {
  @Expose()
  @IsNumber()
  fileId!: AssetFileId;

  @Expose()
  @IsNumber()
  assetId!: AssetId;

  @Expose()
  @IsString()
  assetTitle!: string;

  @Expose()
  @IsString()
  fileName!: string;

  @Expose()
  @IsNumber()
  page!: number;

  @Expose()
  @IsArray()
  @IsString({ each: true })
  highlights!: string[];
}

export class FileSearchResultSchema extends Schema implements FileSearchResult {
  @Expose()
  page!: PageStats;

  @Expose()
  @IsNumber()
  assetTotal!: number;

  @Expose()
  @IsNumber()
  fileTotal!: number;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileSearchResultItemSchema)
  data!: FileSearchResultItem[];
}
