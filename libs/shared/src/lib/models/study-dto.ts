import * as C from 'io-ts/Codec';

export const StudyDTO = C.struct({ studyId: C.string, geomText: C.string });
export interface StudyDTO extends C.TypeOf<typeof StudyDTO> {}

export const StudyDTOs = C.array(StudyDTO);
export type StudyDTOs = C.TypeOf<typeof StudyDTOs>;
