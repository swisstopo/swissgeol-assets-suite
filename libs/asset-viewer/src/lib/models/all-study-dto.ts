import { AllStudyDTOFromAPI, LV95, eqLV95 } from '@asset-sg/shared';
import * as D from 'io-ts/Decoder';
import * as TEq from 'io-ts/Eq';
import { Equals, assert } from 'tsafe';

export const AllStudyDTO = D.struct({
  studyId: D.string,
  isPoint: D.boolean,
  centroid: LV95,
});

export const eqAllStudyDTO = TEq.struct({
  studyId: TEq.string,
  isPoint: TEq.boolean,
  centroid: eqLV95,
});

export type AllStudyDTO = D.TypeOf<typeof AllStudyDTO>;
assert<Equals<AllStudyDTO, D.TypeOf<typeof AllStudyDTOFromAPI>>>();

export const AllStudyDTOs = D.array(AllStudyDTO);
export type AllStudyDTOs = D.TypeOf<typeof AllStudyDTOs>;
export const eqAllStudyDTOs = TEq.array(eqAllStudyDTO);
