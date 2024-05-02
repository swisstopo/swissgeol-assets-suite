import { LV95 } from '@asset-sg/shared';

export interface Search {
  text?: string | null;
  polygon?: LV95[] | null;
  authorId?: number | null;
  createDate?: {
    min: Date | null;
    max: Date | null;
  };
  manCatLabelItemCodes?: string[] | null;
  assetKindItemCodes?: string[] | null;
  usageCodes?: string[] | null;
  geomCodes?: Geometry[] | null;
  languageItemCodes?: string[] | null;
}


type Geometry = 'Point' | 'Polygon' | 'LineString' | 'None'
