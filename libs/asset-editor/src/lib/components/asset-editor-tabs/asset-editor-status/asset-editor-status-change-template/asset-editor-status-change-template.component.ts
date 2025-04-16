import { Component, Input } from '@angular/core';
import { LocalDate, SimpleUser } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status-change-template',
  styleUrls: ['./asset-editor-status-change-template.component.scss'],
  templateUrl: './asset-editor-status-change-template.component.html',
  standalone: false,
})
export class AssetEditorStatusChangeTemplateComponent {
  @Input({ required: true })
  creator!: SimpleUser | null;

  @Input({ required: true })
  createdAt!: LocalDate;
}
