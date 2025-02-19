import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'asset-sg-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss'],
  standalone: true,
  imports: [SvgIconComponent, TranslateModule, FormsModule],
})
export class TextInputComponent {
  @Input() public term = '';
  @Input() public hasSearchIcon = false;
  @Input() public placeholder = '';
  @Output() termChanged = new EventEmitter<string>();

  public changeTerm(): void {
    this.termChanged.emit(this.term);
  }
}
