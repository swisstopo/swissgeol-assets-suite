import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SvgIconComponent, SvgIcons } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button';

@Component({
  selector: 'asset-sg-toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrls: ['./toggle-button.component.scss'],
  imports: [ButtonComponent, TranslateModule, SvgIconComponent],
})
export class ToggleButtonComponent {
  @Input() public isActive = false;
  @Input() public inactiveTranslationKey = '';
  @Input() public activeTranslationKey = '';
  @Input() public activeTranslationIcon: SvgIcons | undefined;
  @Input() public inactiveTranslationIcon: SvgIcons | undefined;

  @Output() toggleIsActive = new EventEmitter();
  @Output() isActiveChange = new EventEmitter<boolean>();

  onInactiveClick() {
    this.toggleIsActive.emit();
    this.isActiveChange.emit(false);
  }

  onActiveClick() {
    this.toggleIsActive.emit();
    this.isActiveChange.emit(true);
  }
}
