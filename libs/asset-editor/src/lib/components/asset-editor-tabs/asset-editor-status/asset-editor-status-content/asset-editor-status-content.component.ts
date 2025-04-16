import { Component, Input } from '@angular/core';
import { Workflow } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status-content',
  styleUrls: ['./asset-editor-status-content.component.scss'],
  templateUrl: './asset-editor-status-content.component.html',
  standalone: false,
})
export class AssetEditorStatusContentComponent {
  @Input({ required: true })
  workflow!: Workflow;
}
