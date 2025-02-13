import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatOption, MatSelect } from '@angular/material/select';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { Translation } from '../smart-translate.pipe';

export interface Filter {
  value: string | number | boolean;
  displayValue: Translation;
}

@Component({
  selector: 'asset-sg-filter-selector',
  templateUrl: './filter-selector.component.html',
  styleUrls: ['./filter-selector.component.scss'],
  standalone: true,
  imports: [MatSelect, MatOption, ReactiveFormsModule, SvgIconComponent, TranslateModule, FormsModule, MatFormField],
})
export class FilterSelectorComponent {
  @Input() public values: Filter[] = [];
  @Input() public title = '';
  @Output() public filterChanged = new EventEmitter<Filter[]>();

  public selectedFilters: Filter[] = [];

  public onFilterChange(selectedValues: Filter[]): void {
    this.filterChanged.emit(selectedValues);
  }
}
