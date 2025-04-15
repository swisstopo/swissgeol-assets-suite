import { Component, inject, Input, OnInit } from '@angular/core';
import { AssetId, Workflow } from '@asset-sg/shared/v2';
import { WorkflowApiService } from '../../../services/workflow-api.service';

@Component({
  selector: 'asset-sg-editor-status',
  styleUrls: ['./asset-editor-status.component.scss'],
  templateUrl: './asset-editor-status.component.html',
  standalone: false,
})
export class AssetEditorStatusComponent implements OnInit {
  @Input({ required: true })
  assetId!: AssetId;

  workflow: Workflow | null = null;

  private readonly workflowApiService = inject(WorkflowApiService);

  ngOnInit(): void {
    this.workflowApiService.fetchWorkflow(this.assetId).subscribe((workflow) => {
      this.workflow = workflow;
    });
  }
}
