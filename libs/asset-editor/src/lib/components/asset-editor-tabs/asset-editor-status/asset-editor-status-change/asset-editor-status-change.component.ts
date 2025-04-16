import { Component, inject, Input, OnInit } from '@angular/core';
import { getUsernameHTML } from '@asset-sg/client-shared';
import { Workflow, WorkflowChange } from '@asset-sg/shared/v2';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'asset-sg-editor-status-change',
  styleUrls: ['./asset-editor-status-change.component.scss'],
  templateUrl: './asset-editor-status-change.component.html',
  standalone: false,
})
export class AssetEditorStatusChangeComponent implements OnInit {
  @Input({ required: true })
  workflow!: Workflow;

  @Input({ required: true })
  change!: WorkflowChange;

  statusMutationText$!: Observable<string>;
  assigneeMutationText$!: Observable<string>;

  readonly translateService = inject(TranslateService);

  ngOnInit() {
    this.statusMutationText$ = combineLatest([
      this.translateService.get(`workflowStatus.${this.change.fromStatus}`),
      this.translateService.get(`workflowStatus.${this.change.toStatus}`),
    ]).pipe(
      switchMap(([from, to]) =>
        this.translateService.get(`edit.tabs.status.statusChanged`, {
          from: `<span class="highlight">${from}</span>`,
          to: `<span class="highlight">${to}</span>`,
        }),
      ),
    );

    this.assigneeMutationText$ = getUsernameHTML(this.translateService, this.change.toAssignee).pipe(
      switchMap((name) =>
        this.translateService.get(`edit.tabs.status.assigneeChanged`, {
          assignee: `<span class="highlight">${name}</span>`,
        }),
      ),
    );
  }
}
