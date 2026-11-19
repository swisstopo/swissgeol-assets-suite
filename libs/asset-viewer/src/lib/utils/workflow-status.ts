import { WorkflowStatus } from '@asset-sg/shared/v2';

export const RequestedChanges = 'RequestedChanges';

/**
 * The category that decides which color an asset has in the "Workflow Status" map mode.
 */
export type MapWorkflowStatus = WorkflowStatus | typeof RequestedChanges;

/**
 * Maps the workflow of an asset to its map category.
 *
 * - Published assets are always `Published`.
 * - Draft, in review and reviewed assets with requested changes are `RequestedChanges`.
 * - Otherwise, the category is the status itself.
 */
export const mapAssetWorkflowToMapStatus = ({
  workflowStatus,
  hasRequestedChanges,
}: {
  workflowStatus: WorkflowStatus;
  hasRequestedChanges: boolean;
}): MapWorkflowStatus => {
  if (workflowStatus === WorkflowStatus.Published) {
    return WorkflowStatus.Published;
  }
  return hasRequestedChanges ? RequestedChanges : workflowStatus;
};
