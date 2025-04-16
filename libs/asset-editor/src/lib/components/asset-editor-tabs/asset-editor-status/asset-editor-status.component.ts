import { Component, inject, Input, OnInit } from '@angular/core';
import { AssetId, LocalDate, SimpleUser, Workflow, WorkflowStatus } from '@asset-sg/shared/v2';
import { WorkflowApiService } from '../../../services/workflow-api.service';

@Component({
  selector: 'asset-sg-editor-status',
  styleUrls: ['./asset-editor-status.component.scss'],
  templateUrl: './asset-editor-status.component.html',
  standalone: false,
})
export class AssetEditorStatusComponent implements OnInit {
  @Input({ required: true })
  assetId!: AssetId;

  workflow: Workflow | null = null;

  private readonly workflowApiService = inject(WorkflowApiService);

  ngOnInit(): void {
    // TODO Remove these once the workflow can be edited.
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

    this.workflowApiService.fetchWorkflow(this.assetId).subscribe((workflow) => {
      this.workflow = {
        ...workflow,
        status: WorkflowStatus.Reviewed,
        workflowChanges: [
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
    });
  }

  protected readonly WorkflowStatus = WorkflowStatus;
}
