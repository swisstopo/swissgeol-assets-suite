// todo assets-629: rework component to core library
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
  @Input() type: 'primary' | 'secondary' | 'tertiary' | 'light' | 'alert' | 'success' | 'warn' = 'primary';
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

  @HostBinding('class.light')
  get isLight() {
    return this.type === 'light';
  }

  @HostBinding('class.alert')
  get isAlert() {
    return this.type === 'alert';
  }

  @HostBinding('class.success')
  get isSuccess() {
    return this.type === 'success';
  }

  @HostBinding('class.warn')
  get isWarn() {
    return this.type === 'warn';
  }
}
