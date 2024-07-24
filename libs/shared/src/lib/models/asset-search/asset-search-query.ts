import { DateRange } from '../date-range';
import { LV95 } from '../lv95';
import { UsageCode } from '../usage';

export interface AssetSearchQuery {
  text?: string;
  polygon?: Polygon;
  authorId?: number;
  createDate?: Partial<DateRange>;
  manCatLabelItemCodes?: string[];
  assetKindItemCodes?: string[];
  usageCodes?: UsageCode[];
  geometryCodes?: Array<GeometryCode | 'None'>;
  languageItemCodes?: string[];
  workgroupIds?: number[];
}

export enum GeometryCode {
  Point = 'Point',
  Polygon = 'Polygon',
  LineString = 'LineString',
}

export type Polygon = LV95[];
