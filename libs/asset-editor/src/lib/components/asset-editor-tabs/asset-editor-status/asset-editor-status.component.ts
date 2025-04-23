import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { can$ } from '@asset-sg/client-shared';
import { LocalDate, SimpleUser, Workflow, WorkflowPolicy, WorkflowStatus } from '@asset-sg/shared/v2';
import { TranslateService } from '@ngx-translate/core';
import type { SgcWorkflowSelectionEntry } from '@swisstopo/swissgeol-ui-core';
import { SgcWorkflowSelectionChangeEvent } from '@swisstopo/swissgeol-ui-core/dist/types/components/sgc-workflow/sgc-workflow-selection/sgc-workflow-selection';
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

  canUpdate$ = can$(WorkflowPolicy, (it) => (this.workflow === null ? false : it.canUpdate(this.workflow)));

  private readonly workflowApiService = inject(WorkflowApiService);
  private readonly translateService = inject(TranslateService);

  readonly selection = makeSelectionEntries(this.translateService);

  ngOnChanges(changes: SimpleChanges) {
    // TODO Remove these once the workflow can be edited.
    if ('workflow' in changes && this.workflow !== null) {
      const userA: SimpleUser = {
        id: '24',
        firstName: 'Hans',
        lastName: 'Muster',
      };
      const userB: SimpleUser = {
        id: '42',
        firstName: 'Frederik',
        lastName: 'Eisenhauer',
      };
      const userC: SimpleUser = {
        id: '132444',
        firstName: 'Sigfrieda',
        lastName: 'Mauermeister',
      };

      this.workflow = {
        ...this.workflow,
        changes: [
          {
            createdAt: LocalDate.of(2024, 8, 6),
            fromStatus: WorkflowStatus.Draft,
            toStatus: WorkflowStatus.InReview,
            comment: null,
            creator: userA,
            fromAssignee: userA,
            toAssignee: userB,
          },
          {
            createdAt: LocalDate.of(2024, 11, 24),
            fromStatus: WorkflowStatus.InReview,
            toStatus: WorkflowStatus.Reviewed,
            comment: 'LGTM',
            creator: userB,
            fromAssignee: userB,
            toAssignee: userC,
          },
          {
            createdAt: LocalDate.of(2025, 1, 29),
            fromStatus: WorkflowStatus.Reviewed,
            toStatus: WorkflowStatus.Draft,
            comment: 'Geometrien fehlen',
            creator: null,
            fromAssignee: userC,
            toAssignee: userA,
          },
        ],
      };
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

  protected readonly WorkflowStatus = WorkflowStatus;
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
