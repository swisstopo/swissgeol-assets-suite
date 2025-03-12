import { Component, HostBinding, Input } from '@angular/core';
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

  @HostBinding('class.disabled')
  @Input()
  disabled = false;

  @HostBinding('class.secondary')
  get isSecondary() {
    return this.type === 'secondary';
  }
}
