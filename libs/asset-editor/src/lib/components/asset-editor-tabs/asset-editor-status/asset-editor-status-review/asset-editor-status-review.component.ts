import { Component, Input } from '@angular/core';
import { Workflow } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status-review',
  styleUrls: ['./asset-editor-status-review.component.scss'],
  templateUrl: './asset-editor-status-review.component.html',
  standalone: false,
})
export class AssetEditorStatusReviewComponent {
  @Input({ required: true })
  workflow!: Workflow;
}
