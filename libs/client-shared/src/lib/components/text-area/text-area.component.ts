import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { noop } from 'rxjs';
import { FormItemWrapperComponent } from '../form-item-wrapper';

@Component({
  selector: 'asset-sg-text-area',
  templateUrl: './text-area.component.html',
  styleUrls: ['./text-area.component.scss'],
  standalone: true,
  imports: [TranslateModule, FormsModule, CdkTextareaAutosize, MatInput, FormItemWrapperComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: TextAreaComponent,
      multi: true,
    },
  ],
})
export class TextAreaComponent implements ControlValueAccessor {
  @Input() public title = '';
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
