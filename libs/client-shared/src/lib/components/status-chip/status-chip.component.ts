import { Component, Input } from '@angular/core';
import { WorkflowStatus } from '@asset-sg/shared/v2';
import { TranslatePipe } from '@ngx-translate/core';
import { ChipComponent } from '../chip';

@Component({
  selector: 'asset-sg-status-chip',
  templateUrl: './status-chip.component.html',
  styleUrl: './status-chip.component.scss',
  imports: [ChipComponent, TranslatePipe],
})
export class StatusChipComponent {
  @Input({ required: true }) status!: WorkflowStatus;
  protected readonly WorkflowStatus = WorkflowStatus;
}
