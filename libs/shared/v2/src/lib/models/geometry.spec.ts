import { LV95X, LV95Y } from '@asset-sg/shared';
import { WorkflowStatus } from '@swissgeol/ui-core';
import { GeometryAccessType, GeometryType, MapGeometry, serializeGeometryAsCsv } from './geometry';

describe('serializeGeometryAsCsv', () => {
  it('serializes a point study in CSV format', () => {
    const geometryType = GeometryType.Point;
    const accessType = GeometryAccessType.Internal;

    // Given
    const study: MapGeometry = {
      id: `a123`,
      type: geometryType,
      assetId: 2393,
      center: { x: 2633499.729333331 as LV95X, y: 1171499.2243333303 as LV95Y },
      accessType: accessType,
      workflowStatus: WorkflowStatus.InReview,
      hasRequestedChanges: false,
    };

    // When
    const csv = serializeGeometryAsCsv(study);

    // Then
    expect(csv).toEqual(`a123;2393;;${accessType};2633499.729333331;1171499.2243333303;InReview;0`);
  });

  it('serializes a non-point study in CSV format', () => {
    const geometryType = GeometryType.LineString;
    const accessType = GeometryAccessType.Internal;

    // Given
    const study: MapGeometry = {
      id: `l934`,
      type: geometryType,
      assetId: 1549232,
      center: { x: 2600230.056 as LV95X, y: 1198450.047 as LV95Y },
      accessType: accessType,
      workflowStatus: WorkflowStatus.Published,
      hasRequestedChanges: false,
    };

    // When
    const csv = serializeGeometryAsCsv(study);

    // Then
    expect(csv).toEqual(`l934;1549232;;${accessType};2600230.056;1198450.047;Published;0`);
  });

  it('serializes the requested-changes flag as 1', () => {
    const study: MapGeometry = {
      id: `t5`,
      type: GeometryType.LineString,
      assetId: 7,
      center: { x: 1 as LV95X, y: 2 as LV95Y },
      accessType: GeometryAccessType.Public,
      workflowStatus: WorkflowStatus.Reviewed,
      hasRequestedChanges: true,
    };

    expect(serializeGeometryAsCsv(study)).toEqual(`t5;7;;${GeometryAccessType.Public};1;2;Reviewed;1`);
  });
});
