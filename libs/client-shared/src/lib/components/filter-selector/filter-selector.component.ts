import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatOption, MatSelect } from '@angular/material/select';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { SmartTranslatePipe, Translation } from '../smart-translate.pipe';

export interface Filter<T> {
  value: T;
  displayValue: Translation;
}

@Component({
  selector: 'asset-sg-filter-selector',
  templateUrl: './filter-selector.component.html',
  styleUrls: ['./filter-selector.component.scss'],
  standalone: true,
  providers: [TranslateModule, SmartTranslatePipe],
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
export class FilterSelectorComponent<T> implements OnInit {
  @Input() public values: Filter<T>[] = [];
  @Input() public title = '';
  @Input({ transform: coerceBooleanProperty }) public multiple = false;
  @Input() public initialValues: Array<T> = [];
  @Input() public shouldShowError = false;
  @Input() public errorMessage = '';
  @Output() public filterChanged = new EventEmitter<Filter<T>[]>();

  public selectedFilters?: Filter<T> | Filter<T>[] = this.multiple ? [] : undefined;

  public ngOnInit(): void {
    if (this.initialValues.length > 0) {
      const filteredValues = this.values.filter((value) => this.initialValues.includes(value.value));
      this.selectedFilters = this.multiple ? filteredValues : filteredValues[0] || null;
    }
  }

  public onFilterChange(selectedValues: Filter<T> | Filter<T>[]): void {
    this.filterChanged.emit(Array.isArray(selectedValues) ? selectedValues : [selectedValues]);
  }
}
