import { DateIdBrand } from '@asset-sg/shared';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsString } from 'class-validator';
import { AssetContactRole, AssetContactRoles } from './contact';

interface AssetSearchResultItemUse {
  isAvailable: boolean;
}

export interface AssetSearchResultItemStudy {
  studyId: string;
  geomText: string;
}

export interface AssetSearchResultItemContact {
  role: AssetContactRole;
  contactId: number;
}

export interface AssetSearchResultItem {
  assetId: number;
  // todo LME: remove DateIdBrand and cast to LocalDate, using two transformers for reduced payload size
  createDate: number & DateIdBrand;
  titlePublic: string;
  studies: AssetSearchResultItemStudy[];
  assetKindItemCode: string;
  assetContacts: AssetSearchResultItemContact[];
  assetFormatItemCode: string;
  manCatLabelRefs: string[];
  internalUse: AssetSearchResultItemUse;
  publicUse: AssetSearchResultItemUse;
}

export interface AssetSearchResult {
  page: PageStats;
  data: AssetSearchResultItem[];
}

export class AssetSearchResultItemStudyDTO implements AssetSearchResultItemStudy {
  @Expose()
  @IsString()
  studyId!: string;

  @Expose()
  @IsString()
  geomText!: string;
}

export class AssetSearchResultItemContactDTO implements AssetSearchResultItemContact {
  @Expose()
  @IsIn(AssetContactRoles)
  role!: AssetContactRole;

  @Expose()
  @IsNumber()
  contactId!: number;
}

export class AssetSearchResultItemUseDTO implements AssetSearchResultItemUse {
  @Expose()
  @IsBoolean()
  isAvailable!: boolean;
}

export class AssetSearchResultItemDTO implements AssetSearchResultItem {
  @Expose()
  @IsNumber()
  assetId!: number;

  @Expose()
  @IsNumber()
  createDate!: number & DateIdBrand;

  @Expose()
  @IsString()
  titlePublic!: string;

  @Expose()
  @IsArray()
  @Type(() => AssetSearchResultItemStudyDTO)
  studies!: AssetSearchResultItemStudyDTO[];

  @Expose()
  @IsString()
  assetKindItemCode!: string;

  @Expose()
  @IsArray()
  @Type(() => AssetSearchResultItemContactDTO)
  assetContacts!: AssetSearchResultItemContactDTO[];

  @Expose()
  @IsString()
  assetFormatItemCode!: string;

  @Expose()
  @IsArray()
  manCatLabelRefs!: string[];

  @Expose()
  @Type(() => AssetSearchResultItemUseDTO)
  internalUse!: AssetSearchResultItemUseDTO;
  @Expose()
  @Type(() => AssetSearchResultItemUseDTO)
  publicUse!: AssetSearchResultItemUse;
}

export class AssetSearchResultDTO implements AssetSearchResult {
  @Expose()
  page!: PageStats;
  @Expose()
  @Type(() => AssetSearchResultItemDTO)
  data!: AssetSearchResultItemDTO[];
}

export interface PageStats {
  size: number;
  offset: number;
  total: number;
}

export const makeEmptyAssetSearchResults = (): AssetSearchResult => ({
  page: {
    size: 0,
    offset: 0,
    total: 0,
  },
  data: [],
});
