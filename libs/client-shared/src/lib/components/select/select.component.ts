import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatOption, MatSelect } from '@angular/material/select';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { noop } from 'rxjs';
import { SmartTranslatePipe } from '../smart-translate.pipe';

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
  @Input() public title = '';
  @Input({ transform: coerceBooleanProperty }) public multiple = false;
  @Input() public initialValues: T[] = [];
  @Input() public shouldShowError = false;
  @Input() public errorMessage = '';
  @Output() public selectionChanged = new EventEmitter<T[]>();

  public selectedValues?: T | T[] = this.multiple ? [] : undefined;

  private onChange: (value: T | T[]) => void = noop;
  private onTouched: () => void = noop;

  public ngOnInit(): void {
    if (this.initialValues.length > 0) {
      const filteredValues = this.values.filter((value) => this.initialValues.includes(value));
      this.selectedValues = this.multiple ? filteredValues : filteredValues[0];
    }
  }

  public onFilterChange(selectedValues: T | T[]): void {
    this.selectedValues = selectedValues;
    this.selectionChanged.emit(Array.isArray(selectedValues) ? selectedValues : [selectedValues]);
    this.onChange(selectedValues);
  }

  public writeValue(value: T | T[]): void {
    this.selectedValues = value;
  }

  public registerOnChange(fn: (value: T | T[]) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public onBlur(): void {
    this.onTouched();
  }
}
