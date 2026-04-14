import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button';

@Component({
  selector: 'asset-sg-toggle-status',
  templateUrl: './toggle-status.component.html',
  styleUrls: ['./toggle-status.component.scss'],
  imports: [ButtonComponent, TranslateModule],
})
export class ToggleStatusComponent {
  @Input() public isActive = false;
  @Input() public inactiveTranslationKey = '';
  @Input() public activeTranslationKey = '';

  @Output() toggleIsActive = new EventEmitter();

  onToggleIsActive() {
    this.toggleIsActive.emit();
  }
}
