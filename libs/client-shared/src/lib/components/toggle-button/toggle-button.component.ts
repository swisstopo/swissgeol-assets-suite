import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button';

@Component({
  selector: 'asset-sg-toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrls: ['./toggle-button.component.scss'],
  imports: [ButtonComponent, TranslateModule],
})
export class ToggleButtonComponent {
  @Input() public isActive = false;
  @Input() public inactiveTranslationKey = '';
  @Input() public activeTranslationKey = '';

  @Output() toggleIsActive = new EventEmitter();

  onToggleIsActive() {
    this.toggleIsActive.emit();
  }
}
