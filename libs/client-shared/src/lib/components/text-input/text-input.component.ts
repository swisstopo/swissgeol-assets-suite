import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { noop } from 'rxjs';
import { FormItemWrapperComponent } from '../form-item-wrapper/form-item-wrapper.component';

@Component({
  selector: 'asset-sg-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss'],
  standalone: true,
  imports: [
    SvgIconComponent,
    TranslateModule,
    FormsModule,
    FormItemWrapperComponent,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: TextInputComponent,
      multi: true,
    },
  ],
})
export class TextInputComponent<T> implements ControlValueAccessor {
  @Input() public title = '';
  @Input() public value = '';
  @Input() public icon = '';
  @Input({ transform: coerceBooleanProperty }) public isRequired = false;
  @Input() public placeholder = '';
  @Input({ transform: coerceBooleanProperty }) public disabled = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<T>();
  @Input() autoCompleteValues: T[] = [];
  @Input() bindLabel!: keyof T;
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

  public onSelectionChange(value: T) {
    this.selectionChange.emit(value);
  }

  public onBlur(): void {
    this.onTouched();
  }
}
