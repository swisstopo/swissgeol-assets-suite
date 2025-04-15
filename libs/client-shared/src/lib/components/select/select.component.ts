import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatOption, MatSelect } from '@angular/material/select';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { noop } from 'rxjs';
import { SmartTranslatePipe } from '../smart-translate.pipe';

type FormValue<T> = T | T[] | T[keyof T] | T[keyof T][];

@Component({
  selector: 'asset-sg-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  standalone: true,
  providers: [
    TranslateModule,
    SmartTranslatePipe,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  imports: [
    MatSelect,
    MatOption,
    ReactiveFormsModule,
    SvgIconComponent,
    TranslateModule,
    FormsModule,
    MatFormField,
    SmartTranslatePipe,
    MatHint,
  ],
})
export class SelectComponent<T> implements OnInit, ControlValueAccessor {
  @Input() public values: T[] = [];
  @Input() public bindLabel: keyof T | null = null;
  @Input() public bindKey: keyof T | null = null;
  @Input() public title = '';
  @Input({ transform: coerceBooleanProperty }) public multiple = false;
  @Input() public initialValues: T[] = [];
  @Input() public shouldShowError = false;
  @Input() public errorMessage = '';
  @Output() public selectionChanged = new EventEmitter<T[]>();

  public selectedValues?: T | T[] = this.multiple ? [] : undefined;

  private onChange: (value: FormValue<T>) => void = noop;
  private onTouched: () => void = noop;

  public ngOnInit(): void {
    const filteredValues = this.values.filter((value) => this.initialValues.includes(value));
    this.selectedValues = this.multiple ? filteredValues : filteredValues[0];
  }

  public onFilterChange(selectedValues: T | T[]): void {
    this.selectedValues = selectedValues;
    this.selectionChanged.emit(Array.isArray(selectedValues) ? selectedValues : [selectedValues]);
    if (this.bindKey) {
      const newValues = Array.isArray(selectedValues)
        ? selectedValues.map((value) => value[this.bindKey!])
        : selectedValues[this.bindKey];
      this.onChange(newValues);
    } else {
      this.onChange(selectedValues);
    }
  }

  // If there is a bindKey, we can assume that the value is a key of T or an array of keys of T.
  // Otherwise, we can assume that the value is a T or an array of T.
  public writeValue(value: FormValue<T>): void {
    if (this.bindKey) {
      this.selectedValues = Array.isArray(value)
        ? this.values.filter((v) => (value as T[keyof T][]).includes(v[this.bindKey!]))
        : this.values.find((v) => v[this.bindKey!] === value);
    } else {
      this.selectedValues = value as T | T[];
    }
  }

  public registerOnChange(fn: (value: FormValue<T>) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public onBlur(): void {
    this.onTouched();
  }
}
