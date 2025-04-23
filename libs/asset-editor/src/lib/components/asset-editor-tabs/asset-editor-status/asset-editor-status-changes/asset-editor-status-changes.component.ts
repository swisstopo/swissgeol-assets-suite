import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Workflow, WorkflowChange } from '@asset-sg/shared/v2';
import { TranslateService } from '@ngx-translate/core';
import { Observable, switchMap } from 'rxjs';

@Component({
  selector: 'asset-sg-editor-status-changes',
  styleUrls: ['./asset-editor-status-changes.component.scss'],
  templateUrl: './asset-editor-status-changes.component.html',
  standalone: false,
})
export class AssetEditorStatusChangesComponent implements OnInit, OnChanges {
  @Input({ required: true })
  workflow!: Workflow;

  changes!: WorkflowChange[];

  createText$!: Observable<string>;

  readonly translateService = inject(TranslateService);

  ngOnInit(): void {
    this.createText$ = this.translateService.get(`workflowStatus.Draft`).pipe(
      switchMap((status) =>
        this.translateService.get(`edit.tabs.status.created`, {
          status: `<span class="highlight">${status}</span>`,
        }),
      ),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('workflow' in changes) {
      this.changes = [...this.workflow.workflowChanges].reverse();
    }
  }
}
