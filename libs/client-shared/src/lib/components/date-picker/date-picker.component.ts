import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule, MatDatepickerToggleIcon } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatSuffix } from '@angular/material/input';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { noop } from 'rxjs';
import { SmartTranslatePipe } from '../smart-translate.pipe';

@Component({
  selector: 'asset-sg-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  standalone: true,
  providers: [
    TranslateModule,
    SmartTranslatePipe,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'de-CH' },
  ],
  imports: [
    MatDatepickerModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    TranslateModule,
    FormsModule,
    MatInput,
    MatSuffix,
    SvgIconComponent,
    MatDatepickerToggleIcon,
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() public title = '';
  @Input() public shouldShowError = false;
  @Input() public errorMessage = '';
  @Output() public selectionChanged = new EventEmitter<Date | null>();

  public date: Date | null = null;

  private onChange: (value: Date | null) => void = noop;
  private onTouched: () => void = noop;

  public onDateChange(date: MatDatepickerInputEvent<Date>): void {
    const value = date.value;
    this.date = value;
    this.onChange(value);
    this.selectionChanged.emit(value);
  }

  public writeValue(value: Date): void {
    this.date = value;
  }

  public registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public onBlur(): void {
    this.onTouched();
  }
}
