import { Expose, Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { AssetId } from '../../models/asset';
import { AssetFileId } from '../../models/asset-file';
import { PageStats } from '../../models/search/asset-search-result';
import { FileSearchResult, FileSearchResultItem, FileSearchResultPage } from '../../models/search/file-search-result';
import { Schema } from '../base/schema';

export class FileSearchResultPageSchema extends Schema implements FileSearchResultPage {
  @Expose()
  @IsNumber()
  page!: number;

  @Expose()
  @IsArray()
  @IsString({ each: true })
  highlights!: string[];
}

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileSearchResultPageSchema)
  pages!: FileSearchResultPage[];
}

export class FileSearchResultSchema extends Schema implements FileSearchResult {
  @Expose()
  page!: PageStats;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileSearchResultItemSchema)
  data!: FileSearchResultItem[];
}
