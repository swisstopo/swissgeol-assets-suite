import { Component, Input } from '@angular/core';
import { can$ } from '@asset-sg/client-shared';
import { Workflow, WorkflowPolicy, WorkflowStatus } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status-publication',
  styleUrls: ['./asset-editor-status-publication.component.scss'],
  templateUrl: './asset-editor-status-publication.component.html',
  standalone: false,
})
export class AssetEditorStatusPublicationComponent {
  @Input({ required: true })
  workflow!: Workflow;

  canUpdate$ = can$(WorkflowPolicy, (it) => it.canUpdate(this.workflow));

  protected readonly WorkflowStatus = WorkflowStatus;
}
