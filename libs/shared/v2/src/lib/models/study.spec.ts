import { LV95X, LV95Y } from '@asset-sg/shared';
import { serializeStudyAsCsv, Study, StudyAccessType, StudyGeometryType } from './study';

describe('serializeStudyAsCsv', () => {
  it('serializes a point study in CSV format', () => {
    const geometryType: StudyGeometryType = 'Point';
    const accessType: StudyAccessType = StudyAccessType.Internal;

    // Given
    const study: Study = {
      id: `study_area_123`,
      assetId: 2393,
      geometryType: geometryType,
      center: { x: 2633499.729333331 as LV95X, y: 1171499.2243333303 as LV95Y },
      accessType: accessType,
    };

    // When
    const csv = serializeStudyAsCsv(study);

    // Then
    expect(csv).toEqual(`area_123;2393;${geometryType};${accessType};2633499.729333331;1171499.2243333303`);
  });

  it('serializes a non-point study in CSV format', () => {
    const geometryType: StudyGeometryType = 'Line';
    const accessType: StudyAccessType = StudyAccessType.Internal;

    // Given
    const study: Study = {
      id: `study_location_934`,
      assetId: 1549232,
      geometryType: geometryType,
      center: { x: 2600230.056 as LV95X, y: 1198450.047 as LV95Y },
      accessType: accessType,
    };

    // When
    const csv = serializeStudyAsCsv(study);

    // Then
    expect(csv).toEqual(`location_934;1549232;${geometryType};${accessType};2600230.056;1198450.047`);
  });
});
