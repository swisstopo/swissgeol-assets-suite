import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { isArray } from 'class-validator';
import { SelectComponent } from '../select';
import { SmartTranslatePipe, Translation } from '../smart-translate.pipe';

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
export class FilterSelectorComponent<T> implements OnInit {
  @Input() public filters: Filter<T>[] = [];
  @Input() public title = '';
  @Input({ transform: coerceBooleanProperty }) public multiple = false;
  @Input() public initialValues: Array<Translation> = [];
  @Output() public filterAdded = new EventEmitter<Filter<T>>();
  @Output() public filterRemoved = new EventEmitter<Filter<T>>();

  public values: Translation[] = [];
  public selectedFilters?: Filter<T> | Filter<T>[] = this.multiple ? [] : undefined;

  public ngOnInit(): void {
    this.values = this.filters.map((filter) => filter.displayValue);
    if (this.initialValues.length > 0) {
      this.selectedFilters = this.filters.filter((filter) => this.initialValues.includes(filter.displayValue));
    }
  }

  public onFilterChange(selectedValues: Translation | Translation[]): void {
    if (!isArray(selectedValues)) {
      selectedValues = [selectedValues];
    }
    const added = this.filters.filter((value) => selectedValues.includes(value.displayValue));
    const removed = this.filters.filter((value) => !selectedValues.includes(value.displayValue));
    for (const filter of added) {
      this.filterAdded.emit(filter);
    }
    for (const filter of removed) {
      this.filterRemoved.emit(filter);
    }
  }
}
