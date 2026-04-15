import { LV95 } from '@asset-sg/shared';
import { WorkflowStatus } from '@swissgeol/ui-core';
import { AssetId } from '../asset';
import { LocalDateRange } from '../base/local-date-range';
import { GeometryType } from '../geometry';
import { LocalizedItemCode } from '../localized-item';
import { WorkgroupId } from '../workgroup';

export enum SearchType {
  Asset = 'asset',
  File = 'file',
}

export interface SearchQuery {
  type: SearchType;
  text?: string;
}

export interface AssetFilters {
  assetIds?: AssetId[];
  polygon?: Polygon;
  authorId?: number;
  usageCodes?: AssetSearchUsageCode[];
  topicCodes?: LocalizedItemCode[];
  kindCodes?: LocalizedItemCode[];
  geometryTypes?: Array<GeometryType | 'None'>;
  languageCodes?: string[];
  workgroupIds?: WorkgroupId[];
  favoritesOnly?: boolean;
  createdAt?: Partial<LocalDateRange>;
  status?: Array<WorkflowStatus>;
}

export type SearchQueries = AssetSearchQuery | FileSearchQuery;

export interface AssetSearchQuery extends SearchQuery, AssetFilters {
  type: SearchType.Asset;
}

export interface FileSearchQuery extends SearchQuery, AssetFilters {
  type: SearchType.File;
}

export enum AssetSearchUsageCode {
  Public = 'public',
  Internal = 'internal',
}

export type Polygon = LV95[];

export const isEmptySearchQuery = ({ favoritesOnly: _ignore, type: _ignoreToo, ...query }: SearchQueries): boolean =>
  Object.values(query).every((value) => value === undefined);
