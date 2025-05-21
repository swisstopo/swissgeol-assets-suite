import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatOption, MatSelectModule } from '@angular/material/select';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { noop } from 'rxjs';
import { FormItemWrapperComponent } from '../form-item-wrapper/form-item-wrapper.component';
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
    MatSelectModule,
    MatOption,
    ReactiveFormsModule,
    SvgIconComponent,
    TranslateModule,
    FormsModule,
    MatFormField,
    SmartTranslatePipe,
    MatHint,
    FormItemWrapperComponent,
  ],
})
export class SelectComponent<T, K> implements OnInit, ControlValueAccessor {
  @Input() public values: T[] = [];
  @Input() public bindLabel: keyof T | null = null;
  @Input() public bindKey: keyof T | null = null;
  @Input() public title = '';
  @Input({ transform: coerceBooleanProperty }) public isRequired = false;
  @Input({ transform: coerceBooleanProperty }) public multiple = false;
  @Input() public initialKeys: K[] = [];
  @Input() public errorMessage = '';
  @Input() trigger = '';
  @Input() disabled = false;
  @Output() public selectionChanged = new EventEmitter<K[]>();

  public selectedValues?: T | T[] = this.multiple ? [] : undefined;

  private onChange: (value: FormValue<T>) => void = noop;
  private onTouched: () => void = noop;

  public ngOnInit(): void {
    const filteredValues = this.values.filter((value) => {
      return this.initialKeys.includes(this.getKey(value));
    });
    this.selectedValues = this.multiple ? filteredValues : filteredValues[0];
  }

  getKey(value: T): K {
    if (this.bindKey) {
      return value[this.bindKey] as K;
    }
    return value as unknown as K;
  }

  public onFilterChange(selectedValues: T | T[]): void {
    this.selectedValues = selectedValues;
    this.selectionChanged.emit(
      Array.isArray(selectedValues) ? selectedValues.map((it) => this.getKey(it)) : [this.getKey(selectedValues)],
    );
    const { bindKey } = this;
    if (bindKey) {
      const newValues = Array.isArray(selectedValues)
        ? selectedValues.map((value) => value[bindKey])
        : selectedValues[bindKey];
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

  protected readonly Array = Array;
}
