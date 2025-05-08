import { DateIdBrand } from '@asset-sg/shared';
import { AssetContactRole } from './contact';

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

export const makeEmptyAssetSearchResults = (): AssetSearchResult => ({
  page: {
    size: 0,
    offset: 0,
    total: 0,
  },
  data: [],
});

export class AssetSearchResultDTO implements AssetSearchResult {
  page!: PageStats;
  data!: AssetSearchResultItem[];
}

export interface PageStats {
  size: number;
  offset: number;
  total: number;
}
