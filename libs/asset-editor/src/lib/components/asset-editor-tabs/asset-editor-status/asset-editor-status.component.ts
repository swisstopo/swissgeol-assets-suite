import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { can$ } from '@asset-sg/client-shared';
import {
  Role,
  SimpleUser,
  UnpublishedWorkflowStatus,
  Workflow,
  WorkflowChangeData,
  WorkflowPolicy,
  WorkflowPublishData,
  WorkflowSelection,
} from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { type SgcWorkflowSelectionEntry, WorkflowChange } from '@swissgeol/ui-core';
import { SgcWorkflowChangeEvent } from '@swissgeol/ui-core/dist/types/components/sgc-workflow/sgc-workflow';
import { SgcWorkflowSelectionChangeEvent } from '@swissgeol/ui-core/dist/types/components/sgc-workflow/sgc-workflow-selection/sgc-workflow-selection';
import { BehaviorSubject } from 'rxjs';
import { AssetEditorService } from '../../../services/asset-editor.service';
import { WorkflowApiService } from '../../../services/workflow-api.service';
import { setWorkflow } from '../../../state/asset-editor.actions';

@Component({
  selector: 'asset-sg-editor-status',
  styleUrls: ['./asset-editor-status.component.scss'],
  templateUrl: './asset-editor-status.component.html',
  standalone: false,
})
export class AssetEditorStatusComponent implements OnChanges {
  private readonly workflow$ = new BehaviorSubject<Workflow | null>(null);
  private readonly store = inject(Store);

  @Input({ required: true })
  set workflow(value: Workflow | null) {
    this.workflow$.next(value);
  }

  get workflow(): Workflow | null {
    return this.workflow$.value;
  }

  availableAssignees: SimpleUser[] = [];

  canUpdate$ = can$(WorkflowPolicy, this.workflow$, (it) =>
    this.workflow === null ? false : it.canUpdate(this.workflow),
  );

  canChangeStatus$ = can$(WorkflowPolicy, this.workflow$, (it) =>
    this.workflow === null ? false : it.canSeeStatusChangeButton(this.workflow),
  );

  private readonly workflowApiService = inject(WorkflowApiService);
  private readonly assetEditorService = inject(AssetEditorService);
  private readonly translateService = inject(TranslateService);

  readonly selection = makeSelectionEntries(this.translateService);

  ngOnChanges(changes: SimpleChanges) {
    if ('workflow' in changes && this.workflow !== null) {
      this.assetEditorService.getUsersForWorkgroup(this.workflow.workgroupId).subscribe((users) => {
        this.availableAssignees = users.filter((user) => user.role !== Role.Reader);
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
      this.store.dispatch(
        setWorkflow({
          workflow: {
            ...workflow,
            review: {
              ...workflow.approval,
              ...patch,
            },
          },
        }),
      );
    });
  }

  handleApprovalChange(event: SgcWorkflowSelectionChangeEvent): void {
    const { workflow } = this;
    if (workflow === null) {
      return;
    }

    const patch = event.detail.changes as Partial<WorkflowSelection>;
    this.workflowApiService.updateApproval(workflow.id, patch).subscribe(() => {
      this.store.dispatch(
        setWorkflow({
          workflow: {
            ...workflow,
            approval: {
              ...workflow.approval,
              ...patch,
            },
          },
        }),
      );
    });
  }

  handleWorkflowChange(event: SgcWorkflowChangeEvent): void {
    if (!this.workflow) {
      return;
    }
    const workflowChange: WorkflowChange = event.detail.changes;
    const data: WorkflowChangeData = {
      status: workflowChange.toStatus as UnpublishedWorkflowStatus,
      comment: workflowChange.comment,
      assigneeId: (workflowChange.toAssignee?.id as string) ?? null,
      hasRequestedChanges: workflowChange.hasRequestedChanges,
    };
    this.assetEditorService.createWorkflowChange(this.workflow.id, data).subscribe((workflow) => {
      this.store.dispatch(
        setWorkflow({
          workflow,
        }),
      );
      this.workflow = workflow;
    });
  }

  handleWorkflowPublish(event: SgcWorkflowChangeEvent): void {
    if (!this.workflow) {
      return;
    }
    const data: WorkflowPublishData = {
      comment: event.detail.changes.comment,
    };
    this.assetEditorService.publishAsset(this.workflow.id, data).subscribe((workflow) => {
      this.store.dispatch(
        setWorkflow({
          workflow,
        }),
      );
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
