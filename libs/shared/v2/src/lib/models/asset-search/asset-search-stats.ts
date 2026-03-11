import { WorkflowStatus } from '@swissgeol/ui-core';
import { LocalDateRange } from '../base/local-date-range';
import { ContactId } from '../contact';
import { GeometryType } from '../geometry';
import { LocalizedItemCode } from '../localized-item';
import { WorkgroupId } from '../workgroup';
import { AssetSearchUsageCode } from './asset-search-query';

export interface AssetSearchStats {
  total: number;
  authorIds: ValueCount<ContactId>[];
  kindCodes: ValueCount<LocalizedItemCode>[];
  languageCodes: ValueCount<LocalizedItemCode>[];
  geometryTypes: ValueCount<GeometryType | 'None'>[];
  topicCodes: ValueCount<LocalizedItemCode>[];
  usageCodes: ValueCount<AssetSearchUsageCode>[];
  workgroupIds: ValueCount<WorkgroupId>[];
  createdAt: LocalDateRange | null;
  status: ValueCount<WorkflowStatus>[];
}

export interface ValueCount<T> {
  value: T;
  count: number;
}

export const makeEmptyAssetSearchStats = (): AssetSearchStats => ({
  total: 0,
  authorIds: [],
  kindCodes: [],
  languageCodes: [],
  geometryTypes: [],
  topicCodes: [],
  usageCodes: [],
  workgroupIds: [],
  createdAt: null,
  status: [],
});
