import { LV95 } from '@asset-sg/shared';
import { WorkflowStatus } from '@swissgeol/ui-core';
import { LocalDateRange } from '../base/local-date-range';
import { GeometryType } from '../geometry';
import { LocalizedItemCode } from '../localized-item';
import { WorkgroupId } from '../workgroup';

export interface AssetSearchQuery {
  text?: string;
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

export enum AssetSearchUsageCode {
  Public = 'public',
  Internal = 'internal',
}

export type Polygon = LV95[];

export const isEmptySearchQuery = ({ favoritesOnly: _ignore, ...query }: AssetSearchQuery): boolean =>
  Object.values(query).every((value) => value === undefined);
