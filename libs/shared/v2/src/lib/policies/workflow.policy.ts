import { Workflow, WorkflowStatus } from '../models/workflow';
import { Role } from '../models/workgroup';
import { Policy } from './base/policy';

export class WorkflowPolicy extends Policy<Workflow> {
  canShow(workflow: Workflow): boolean {
    // A user can see every workflow of the workgroups assigned to them.
    return this.user.isAdmin || this.hasWorkgroup(workflow.workgroupId);
  }

  canCreate(): boolean {
    // Workflows are created implicitly for each asset.
    return false;
  }

  override canUpdate(workflow: Workflow): boolean {
    const requiredRole = getRoleForStatus(workflow.status);
    return this.hasRole(requiredRole, workflow.workgroupId);
  }

  canChangeStatus(workflow: Workflow): boolean {
    return workflow.status === WorkflowStatus.Published
      ? this.hasRole(Role.Publisher, workflow.workgroupId)
      : this.hasRole(Role.Reviewer, workflow.workgroupId);
  }
}

export const getRoleForStatus = (status: WorkflowStatus): Role => {
  switch (status) {
    case WorkflowStatus.Draft:
      return Role.Editor;
    case WorkflowStatus.InReview:
      return Role.Reviewer;
    case WorkflowStatus.Reviewed:
    case WorkflowStatus.Published:
      return Role.Publisher;
  }
};
