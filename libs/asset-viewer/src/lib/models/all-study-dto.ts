import { LV95 } from '@asset-sg/shared';
import { StudyAccessType, StudyGeometryType } from '@asset-sg/shared/v2';

export interface AllStudyDTO {
  studyId: string;
  assetId: number;
  geometryType: StudyGeometryType;
  centroid: LV95;
  accessType: StudyAccessType;
}
