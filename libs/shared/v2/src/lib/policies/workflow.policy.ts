import { WorkflowStatus } from '@swissgeol/ui-core';
import { Workflow } from '../models/workflow';
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

  // Editors can change the assignee if the workflow is in draft or in review.
  canChangeAssignee(workflow: Workflow): boolean {
    switch (workflow.status) {
      case WorkflowStatus.Draft:
      case WorkflowStatus.InReview:
        return this.hasRole(Role.Editor, workflow.workgroupId);
      case WorkflowStatus.Reviewed:
        return this.hasRole(Role.Reviewer, workflow.workgroupId);
      case WorkflowStatus.Published:
        return this.hasRole(Role.Publisher, workflow.workgroupId);
    }
  }

  // Frontend only. The StatusChangeButton is visible in Draft Status for Reviewers and Publishers, but not for Editors.
  canSeeStatusChangeButton(workflow: Workflow): boolean {
    return workflow.status === WorkflowStatus.Published
      ? this.hasRole(Role.Publisher, workflow.workgroupId)
      : this.hasRole(Role.Reviewer, workflow.workgroupId);
  }

  // This allows Reviewers to make changes to reviewed workflows
  canChangeStatus(workflow: Workflow): boolean {
    switch (workflow.status) {
      case WorkflowStatus.Draft:
        return this.hasRole(Role.Editor, workflow.workgroupId);
      case WorkflowStatus.InReview:
      case WorkflowStatus.Reviewed:
        return this.hasRole(Role.Reviewer, workflow.workgroupId);
      case WorkflowStatus.Published:
        return this.hasRole(Role.Publisher, workflow.workgroupId);
    }
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
