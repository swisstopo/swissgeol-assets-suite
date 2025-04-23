import { Component, Input } from '@angular/core';
import { Workflow, WorkflowStatus } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status',
  styleUrls: ['./asset-editor-status.component.scss'],
  templateUrl: './asset-editor-status.component.html',
  standalone: false,
})
export class AssetEditorStatusComponent {
  @Input({ required: true })
  workflow!: Workflow | null;

  protected readonly WorkflowStatus = WorkflowStatus;
}
