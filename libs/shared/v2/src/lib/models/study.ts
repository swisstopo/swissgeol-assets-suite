import { LV95 } from '@asset-sg/shared';
import { AssetId } from './asset';

export type StudyGeometryType = 'Point' | 'Line' | 'Polygon';

export interface Study {
  id: StudyId;
  center: LV95;
  geometryType: StudyGeometryType;
  assetId: AssetId;
}

export type StudyId = `study_${StudyType}_${number}`;
export enum StudyType {
  Area = 'area',
  Location = 'location',
  Trace = 'trace',
}

export const serializeStudyAsCsv = (study: Study): string => {
  return `${study.id.substring(6)};${study.assetId};${study.geometryType};${study.center.x};${study.center.y}`;
};
