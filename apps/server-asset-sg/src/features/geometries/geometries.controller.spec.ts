import { LV95X, LV95Y } from '@asset-sg/shared';
import {
  AssetSearchResultItem,
  GeometryAccessType,
  GeometryType,
  serializeGeometryAsCsv,
  WorkflowStatus,
} from '@asset-sg/shared/v2';
import { mapToGeometry } from './geometries.controller';

describe(mapToGeometry, () => {
  it('carries the status and flag of an item over to its geometries', () => {
    const item = {
      id: 7,
      isPublic: false,
      geometries: [{ id: 'g1', type: GeometryType.Point, centroid: { x: 1 as LV95X, y: 2 as LV95Y } }],
      workflowStatus: WorkflowStatus.InReview,
      hasRequestedChanges: true,
    } as unknown as AssetSearchResultItem;

    expect(mapToGeometry([item]).map(serializeGeometryAsCsv)).toEqual([
      `g1;7;;${GeometryAccessType.Internal};1;2;InReview;1`,
    ]);
  });
});
