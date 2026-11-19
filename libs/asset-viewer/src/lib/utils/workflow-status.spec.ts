import { WorkflowStatus } from '@asset-sg/shared/v2';
import { mapAssetWorkflowToMapStatus, RequestedChanges } from './workflow-status';

describe(mapAssetWorkflowToMapStatus, () => {
  it.each([
    [WorkflowStatus.Draft, false, WorkflowStatus.Draft],
    [WorkflowStatus.InReview, false, WorkflowStatus.InReview],
    [WorkflowStatus.Reviewed, false, WorkflowStatus.Reviewed],
    [WorkflowStatus.Published, false, WorkflowStatus.Published],
    [WorkflowStatus.Draft, true, RequestedChanges],
    [WorkflowStatus.InReview, true, RequestedChanges],
    [WorkflowStatus.Reviewed, true, RequestedChanges],
    [WorkflowStatus.Published, true, WorkflowStatus.Published],
  ])('maps %s with requested changes = %s to %s', (workflowStatus, hasRequestedChanges, expected) => {
    expect(mapAssetWorkflowToMapStatus({ workflowStatus, hasRequestedChanges })).toEqual(expected);
  });
});
