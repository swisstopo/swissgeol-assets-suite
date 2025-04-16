import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { LocalDate, SimpleUser, Workflow, WorkflowStatus } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status',
  styleUrls: ['./asset-editor-status.component.scss'],
  templateUrl: './asset-editor-status.component.html',
  standalone: false,
})
export class AssetEditorStatusComponent implements OnChanges {
  @Input({ required: true })
  workflow!: Workflow | null;

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
    }
  }

  protected readonly WorkflowStatus = WorkflowStatus;
}
