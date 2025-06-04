import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { can$ } from '@asset-sg/client-shared';
import {
  SimpleUser,
  UnpublishedWorkflowStatus,
  Workflow,
  WorkflowChangeData,
  WorkflowPolicy,
  WorkflowSelection,
} from '@asset-sg/shared/v2';
import { TranslateService } from '@ngx-translate/core';
import { type SgcWorkflowSelectionEntry, WorkflowChange } from '@swisstopo/swissgeol-ui-core';
import { SgcWorkflowSelectionChangeEvent } from '@swisstopo/swissgeol-ui-core/dist/types/components/sgc-workflow/sgc-workflow-selection/sgc-workflow-selection';
import { AssetEditorService } from '../../../services/asset-editor.service';
import { WorkflowApiService } from '../../../services/workflow-api.service';

@Component({
  selector: 'asset-sg-editor-status',
  styleUrls: ['./asset-editor-status.component.scss'],
  templateUrl: './asset-editor-status.component.html',
  standalone: false,
})
export class AssetEditorStatusComponent implements OnChanges {
  @Input({ required: true })
  workflow!: Workflow | null;
  availableAssignees: SimpleUser[] = [];

  canUpdate$ = can$(WorkflowPolicy, (it) => (this.workflow === null ? false : it.canUpdate(this.workflow)));

  private readonly workflowApiService = inject(WorkflowApiService);
  private readonly assetEditorService = inject(AssetEditorService);
  private readonly translateService = inject(TranslateService);

  readonly selection = makeSelectionEntries(this.translateService);

  ngOnChanges(changes: SimpleChanges) {
    if ('workflow' in changes && this.workflow !== null) {
      this.assetEditorService.getUsersForCurrentWorkgroup(this.workflow.workgroupId).subscribe((users) => {
        this.availableAssignees = users;
      });
    }
  }

  handleReviewChange(event: SgcWorkflowSelectionChangeEvent): void {
    const { workflow } = this;
    if (workflow === null) {
      return;
    }

    const patch = event.detail.changes as Partial<WorkflowSelection>;
    this.workflowApiService.updateReview(workflow.id, patch).subscribe(() => {
      workflow.review = {
        ...workflow.review,
        ...patch,
      };
    });
  }

  handleApprovalChange(event: SgcWorkflowSelectionChangeEvent): void {
    const { workflow } = this;
    if (workflow === null) {
      return;
    }

    const patch = event.detail.changes as Partial<WorkflowSelection>;
    this.workflowApiService.updateApproval(workflow.id, patch).subscribe(() => {
      workflow.approval = {
        ...workflow.approval,
        ...patch,
      };
    });
  }

  handleWorkflowChange(event: any): void {
    const workflowChange: WorkflowChange = event.detail;
    const data: WorkflowChangeData = {
      status: workflowChange.toStatus as UnpublishedWorkflowStatus,
      comment: workflowChange.comment,
      assigneeId: (workflowChange.toAssignee?.id as string) ?? this.workflow?.assignee?.id,
      hasRequestedChanges: true,
    };
    this.assetEditorService.createWorkflowChange(this.workflow!.id, data).subscribe((workflow) => {
      this.workflow = workflow;
    });
  }

  handleWorkflowPublish(): void {
    this.assetEditorService.publishAsset(this.workflow!.id).subscribe((workflow) => {
      this.workflow = workflow;
    });
  }
}

const makeSelectionEntries = (
  translateService: TranslateService,
): SgcWorkflowSelectionEntry<keyof WorkflowSelection>[] => {
  const field = (name: keyof WorkflowSelection) => ({
    field: name,
    name: () => translateService.instant(`workflowSelection.${name}`),
  });
  return [
    field('general'),
    {
      name: () => translateService.instant('edit.tabs.status.selectionCategories.files'),
      fields: [field('normalFiles'), field('legalFiles')],
    },
    {
      name: () => translateService.instant('edit.tabs.status.selectionCategories.contacts'),
      fields: [field('initiators'), field('suppliers'), field('authors')],
    },
    field('references'),
    field('geometries'),
    field('legacy'),
  ];
};
