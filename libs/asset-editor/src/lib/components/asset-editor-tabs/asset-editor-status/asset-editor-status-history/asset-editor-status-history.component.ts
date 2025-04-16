import { Component, Input } from '@angular/core';
import { Workflow } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status-history',
  styleUrls: ['./asset-editor-status-history.component.scss'],
  templateUrl: './asset-editor-status-history.component.html',
  standalone: false,
})
export class AssetEditorStatusHistoryComponent {
  @Input({ required: true })
  workflow!: Workflow;
}
