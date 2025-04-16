import { Component, HostBinding, Input, OnChanges, SimpleChanges } from '@angular/core';
import { getWorkflowStatusIndex, Workflow, WorkflowStatus } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-editor-status-step, li[asset-sg-editor-status-step]',
  styleUrls: ['./asset-editor-status-step.component.scss'],
  templateUrl: './asset-editor-status-step.component.html',
  standalone: false,
})
export class AssetEditorStatusStepComponent implements OnChanges {
  @Input({ required: true })
  workflow!: Workflow;

  @Input({ required: true })
  status!: WorkflowStatus;

  index!: number;

  stage!: Stage;

  ngOnChanges(changes: SimpleChanges): void {
    if ('status' in changes) {
      this.index = getWorkflowStatusIndex(this.status);
    }
    if ('workflow' in changes) {
      this.stage = this.getStageByWorkflow();
    }
  }

  private getStageByWorkflow(): Stage {
    const activeIndex = getWorkflowStatusIndex(this.workflow.status);
    if (activeIndex === this.index) {
      return Stage.Active;
    } else if (activeIndex < this.index) {
      return Stage.Inactive;
    } else {
      return Stage.Done;
    }
  }

  get isDone(): boolean {
    return this.stage === Stage.Done || (this.stage === Stage.Active && this.status === WorkflowStatus.Published);
  }

  @HostBinding('class')
  get hostClass(): object {
    return {
      ['is-active']:
        this.stage === Stage.Active || (this.stage === Stage.Done && this.status === WorkflowStatus.Reviewed),
    };
  }

  protected readonly Stage = Stage;
  protected readonly WorkflowStatus = WorkflowStatus;
}

export enum Stage {
  Done,
  Active,
  Inactive,
}
