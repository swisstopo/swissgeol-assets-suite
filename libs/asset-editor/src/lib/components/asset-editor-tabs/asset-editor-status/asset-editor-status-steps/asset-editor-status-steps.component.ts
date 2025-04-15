import { Component, Input } from '@angular/core';
import { can$ } from '@asset-sg/client-shared';
import { Workflow, WorkflowPolicy, WorkflowStatus } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status-steps',
  styleUrls: ['./asset-editor-status-steps.component.scss'],
  templateUrl: './asset-editor-status-steps.component.html',
  standalone: false,
})
export class AssetEditorStatusStepsComponent {
  @Input({ required: true })
  workflow!: Workflow;
  protected readonly WorkflowStatus = WorkflowStatus;

  canUpdate$ = can$(WorkflowPolicy, (it) => it.canUpdate(this.workflow));
}
