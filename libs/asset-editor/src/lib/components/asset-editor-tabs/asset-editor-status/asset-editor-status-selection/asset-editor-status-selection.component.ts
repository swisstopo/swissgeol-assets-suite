import { Component, HostBinding, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { can$ } from '@asset-sg/client-shared';
import { getEntries, Workflow, WorkflowPolicy, WorkflowSelection, WorkflowStatus } from '@asset-sg/shared/v2';
import { firstValueFrom } from 'rxjs';
import { WorkflowApiService } from '../../../../services/workflow-api.service';

@Component({
  selector: 'asset-sg-editor-status-selection',
  styleUrls: ['./asset-editor-status-selection.component.scss'],
  templateUrl: './asset-editor-status-selection.component.html',
  standalone: false,
})
export class AssetEditorStatusSelectionComponent implements OnChanges {
  @Input({ required: true })
  workflow!: Workflow;

  @Input({ required: true })
  selection!: 'review' | 'approval';

  form!: SelectionForm;

  private timeoutForSubmit: number | null = null;

  private readonly workflowApiService = inject(WorkflowApiService);

  readonly canUpdate$ = can$(WorkflowPolicy, (it) => it.canUpdate(this.workflow));

  constructor() {
    this.submit = this.submit.bind(this);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('workflow' in changes) {
      this.initializeForm().then();
    }
  }

  private async initializeForm(): Promise<void> {
    this.form = buildForm(this.workflow[this.selection]);
    if (!this.hasCorrectStatus || !(await firstValueFrom(this.canUpdate$))) {
      this.form.disable({ emitEvent: false });
    } else if (this.selection === 'approval') {
      this.configureDisabledApprovalFields();
    }
    this.form.valueChanges.subscribe(() => {
      if (this.timeoutForSubmit !== null) {
        clearTimeout(this.timeoutForSubmit);
      }
      this.timeoutForSubmit = setTimeout(this.submit, 500);
    });
  }

  private configureDisabledApprovalFields(): void {
    const { review } = this.workflow;
    for (const [key, isReviewed] of getEntries(review)) {
      if (!isReviewed) {
        this.form.controls[key].disable({ emitEvent: false });
      }
    }
  }

  get hasCorrectStatus(): boolean {
    switch (this.selection) {
      case 'review':
        return this.workflow.status === WorkflowStatus.InReview;
      case 'approval':
        return this.workflow.status === WorkflowStatus.Reviewed;
    }
  }

  private submit(): void {
    this.timeoutForSubmit = null;
    const patch: Partial<WorkflowSelection> = {};
    for (const [key, field] of getEntries(this.form.controls)) {
      if (field.value !== this.workflow[this.selection][key]) {
        patch[key] = field.value;
      }
    }
    switch (this.selection) {
      case 'review':
        this.workflowApiService.updateReview(this.workflow.id, patch).subscribe();
        break;
      case 'approval':
        this.workflowApiService.updateApproval(this.workflow.id, patch).subscribe();
        break;
    }
  }

  @HostBinding('class')
  private get hostClasses(): object {
    return {
      [`is-${this.selection}`]: true,
    };
  }
}

type SelectionFormFields = Record<keyof WorkflowSelection, FormControl<boolean>>;
type SelectionForm = FormGroup<SelectionFormFields>;

const buildForm = (selection: WorkflowSelection): SelectionForm => {
  return new FormGroup(
    getEntries(selection).reduce((form, [key, value]) => {
      form[key] = new FormControl(value, {
        nonNullable: true,
      });
      return form;
    }, {} as SelectionFormFields),
  );
};
