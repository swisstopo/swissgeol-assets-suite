import { Component, HostBinding, Input } from '@angular/core';
import { MatChip } from '@angular/material/chips';
import { SvgIconComponent } from '@ngneat/svg-icon';

@Component({
  standalone: true,
  selector: 'asset-sg-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss'],
  imports: [MatChip, SvgIconComponent],
})
export class ChipComponent {
  @Input() type: 'primary' | 'secondary' | 'tertiary' = 'primary';
  @Input() icon: string | null = null;

  @HostBinding('class.disabled')
  @Input()
  disabled = false;

  @HostBinding('class.secondary')
  get isSecondary() {
    return this.type === 'secondary';
  }

  @HostBinding('class.tertiary')
  get isTertiary() {
    return this.type === 'tertiary';
  }
}
