import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { isArray } from 'class-validator';
import { Translation } from '../../models/translation.model';
import { SelectComponent } from '../select';
import { SmartTranslatePipe } from '../smart-translate.pipe';

export interface Filter<T> {
  key: keyof T;
  displayValue: Translation;
  match: (value: T) => boolean;
}

@Component({
  selector: 'asset-sg-filter-selector',
  templateUrl: './filter-selector.component.html',
  styleUrls: ['./filter-selector.component.scss'],
  standalone: true,
  providers: [TranslateModule, SmartTranslatePipe],
  imports: [ReactiveFormsModule, TranslateModule, FormsModule, SelectComponent],
})
export class FilterSelectorComponent<T> {
  @Input() public filters: Filter<T>[] = [];
  @Input() public title = '';
  @Input({ transform: coerceBooleanProperty }) public multiple = false;
  @Input() public selectedFilters: Filter<T>[] = [];
  @Output() public filterAdded = new EventEmitter<Filter<T>>();
  @Output() public filterRemoved = new EventEmitter<Filter<T>>();

  public onFilterChange(selectedValues: Filter<T> | Filter<T>[]): void {
    if (!isArray(selectedValues)) {
      selectedValues = [selectedValues];
    }
    const newFilters = new Set(selectedValues);
    for (const filter of this.selectedFilters) {
      const isNew = newFilters.delete(filter);
      if (!isNew) {
        this.filterRemoved.emit(filter);
      }
    }
    for (const newFilter of newFilters) {
      this.filterAdded.emit(newFilter);
    }
    this.selectedFilters = selectedValues;
  }
}
