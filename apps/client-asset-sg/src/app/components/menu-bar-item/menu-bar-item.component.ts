import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'li[asset-sg-menu-bar-item]',
  templateUrl: './menu-bar-item.component.html',
  styleUrl: './menu-bar-item.component.scss',
})
export class MenuBarItemComponent {
  @Input({ required: true })
  icon!: string;

  @Input()
  link: string[] | null = null;

  @Input({ transform: coerceBooleanProperty })
  disabled = false;

  @HostBinding('class.is-active')
  @Input()
  isActive = false;

  @HostBinding('aria-disabled')
  @HostBinding('disabled')
  get isDisabled(): boolean {
    return this.disabled;
  }
}
