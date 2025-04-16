import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'asset-sg-form-item-wrapper',
  templateUrl: './form-item-wrapper.component.html',
  styleUrls: ['./form-item-wrapper.component.scss'],
  standalone: true,
  imports: [TranslateModule, FormsModule, SvgIconComponent],
})
export class FormItemWrapperComponent {
  @Input() public title = '';
  @Input() public icon = '';
}
