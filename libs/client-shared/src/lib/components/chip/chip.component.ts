import { Component, Input } from '@angular/core';
import { MatChip } from '@angular/material/chips';

@Component({
  standalone: true,
  selector: 'asset-sg-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss'],
  imports: [MatChip],
})
export class ChipComponent {
  @Input() type: 'primary' | 'secondary' = 'primary';
  @Input() text = '';
}
