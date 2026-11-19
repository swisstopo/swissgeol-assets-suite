import { GeometryAccessType, WorkflowStatus } from '@asset-sg/shared/v2';
import { parseGeometryLine } from './geometry.service';

describe(parseGeometryLine, () => {
  it('parses the workflow status and the requested-changes flag', () => {
    expect(parseGeometryLine('a12;5;;1;2600000.5;1200000.25;InReview;1')).toEqual({
      id: 'a12',
      assetId: 5,
      type: '',
      center: { x: 2600000.5, y: 1200000.25 },
      accessType: GeometryAccessType.Internal,
      workflowStatus: WorkflowStatus.InReview,
      hasRequestedChanges: true,
    });
  });

  it('parses a cleared requested-changes flag', () => {
    expect(parseGeometryLine('l3;9;;0;1;2;Published;0').hasRequestedChanges).toEqual(false);
  });
});
