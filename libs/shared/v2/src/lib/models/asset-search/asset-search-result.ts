import { LocalDate } from '@swissgeol/ui-core';
import { AssetId } from '../asset';
import { AssetContactRole, ContactId } from '../contact';
import { GeometryDetail, GeometryId } from '../geometry';
import { LocalizedItemCode } from '../localized-item';

export interface AssetSearchResultGeometry {
  id: GeometryId;
  geomText: string;
}

export interface AssetSearchResultContact {
  id: ContactId;
  role: AssetContactRole;
}

export interface AssetSearchResultItem {
  id: AssetId;
  title: string;
  isPublic: boolean;
  kindCode: LocalizedItemCode;
  formatCode: LocalizedItemCode;
  topicCodes: LocalizedItemCode[];
  contacts: AssetSearchResultContact[];
  geometries: GeometryDetail[];
  createdAt: LocalDate;
}

export interface AssetSearchResult {
  page: PageStats;
  data: AssetSearchResultItem[];
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
