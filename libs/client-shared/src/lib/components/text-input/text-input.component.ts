import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { noop } from 'rxjs';

@Component({
  selector: 'asset-sg-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss'],
  standalone: true,
  imports: [SvgIconComponent, TranslateModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: TextInputComponent,
      multi: true,
    },
  ],
})
export class TextInputComponent implements ControlValueAccessor {
  @Input() public value = '';
  @Input() public icon = '';
  @Input() public placeholder = '';
  @Output() valueChange = new EventEmitter<string>();
  private onChange: (value: string) => void = noop;
  private onTouched: () => void = noop;

  public writeValue(value: string) {
    this.value = value;
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public changeTerm(value: string): void {
    if (this.value !== value) {
      this.value = value;
      this.valueChange.emit(value);
      this.onChange(value);
    }
  }

  public onBlur(): void {
    this.onTouched();
  }
}
