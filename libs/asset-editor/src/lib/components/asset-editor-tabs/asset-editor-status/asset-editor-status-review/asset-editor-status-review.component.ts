import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { getEntries, Workflow, WorkflowSelection } from '@asset-sg/shared/v2';
import { WorkflowApiService } from '../../../../services/workflow-api.service';

@Component({
  selector: 'asset-sg-editor-status-review',
  styleUrls: ['./asset-editor-status-review.component.scss'],
  templateUrl: './asset-editor-status-review.component.html',
  standalone: false,
})
export class AssetEditorStatusReviewComponent implements OnChanges {
  @Input({ required: true })
  workflow!: Workflow;

  form!: SelectionForm;

  private timeoutForSubmit: number | null = null;

  private readonly workflowApiService = inject(WorkflowApiService);

  constructor() {
    this.submit = this.submit.bind(this);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('workflow' in changes) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    this.form = buildForm(this.workflow.review);
    this.form.valueChanges.subscribe(() => {
      if (this.timeoutForSubmit !== null) {
        clearTimeout(this.timeoutForSubmit);
      }
      this.timeoutForSubmit = setTimeout(this.submit, 500);
    });
  }

  private submit(): void {
    console.log('submit!');
    this.timeoutForSubmit = null;
    const patch: Partial<WorkflowSelection> = {};
    for (const [key, field] of getEntries(this.form.controls)) {
      if (field.value !== this.workflow.review[key]) {
        patch[key] = field.value;
      }
    }
    this.workflowApiService.updateReview(this.workflow.id, patch).subscribe();
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
