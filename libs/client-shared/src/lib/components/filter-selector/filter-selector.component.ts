import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { User } from '@asset-sg/shared/v2';

export interface PossibleValue {
  value: string | number | boolean;
  displayValue: string;
}

export interface FilterChangedEvent {
  selectedValues: PossibleValue[];
  field: keyof User;
}

@Component({
  selector: 'asset-sg-filter-selector-input',
  templateUrl: './filter-selector.component.html',
  styleUrls: ['./filter-selector.component.scss'],
  standalone: true,
  imports: [MatFormField, MatSelect, MatOption, ReactiveFormsModule],
})
export class FilterSelectorComponent implements OnInit {
  form = new FormControl<PossibleValue[]>([]);
  @Input() public values: PossibleValue[] = [
    {
      value: 'admin',
      displayValue: 'Admin',
    },
  ];
  @Input() public field: keyof User = 'lang';
  @Input() public title = 'Filter';
  @Output() public filterChanged = new EventEmitter<FilterChangedEvent>();

  public ngOnInit() {
    this.form.valueChanges.subscribe((selectedValues) => {
      this.filterChanged.emit({
        selectedValues: selectedValues ?? [],
        field: this.field,
      });
    });
  }
}
