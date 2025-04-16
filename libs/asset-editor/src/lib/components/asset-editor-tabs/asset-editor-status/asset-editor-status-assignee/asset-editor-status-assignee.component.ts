import { Component, Input } from '@angular/core';
import { Workflow } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status-assignee',
  styleUrls: ['./asset-editor-status-assignee.component.scss'],
  templateUrl: './asset-editor-status-assignee.component.html',
  standalone: false,
})
export class AssetEditorStatusAssigneeComponent {
  @Input({ required: true })
  workflow!: Workflow;
}
