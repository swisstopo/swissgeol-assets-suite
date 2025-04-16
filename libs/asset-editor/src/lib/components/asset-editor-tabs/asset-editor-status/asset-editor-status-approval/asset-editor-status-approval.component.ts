import { Component, Input } from '@angular/core';
import { Workflow } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status-approval',
  styleUrls: ['./asset-editor-status-approval.component.scss'],
  templateUrl: './asset-editor-status-approval.component.html',
  standalone: false,
})
export class AssetEditorStatusApprovalComponent {
  @Input({ required: true })
  workflow!: Workflow;
}
