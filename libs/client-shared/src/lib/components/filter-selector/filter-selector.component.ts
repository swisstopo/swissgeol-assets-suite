import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';

export interface PossibleValue {
  value: string | number | boolean;
  displayValue: string;
}

@Component({
  selector: 'asset-sg-filter-selector-input',
  templateUrl: './filter-selector.component.html',
  styleUrls: ['./filter-selector.component.scss'],
  standalone: true,
  imports: [MatFormField, MatSelect, MatOption, ReactiveFormsModule, SvgIconComponent, TranslateModule],
})
export class FilterSelectorComponent implements OnInit {
  form = new FormControl<PossibleValue[]>([]);
  @Input() public values: PossibleValue[] = [];
  @Input() public title = '';
  @Output() public filterChanged = new EventEmitter<PossibleValue[]>();

  public ngOnInit() {
    this.form.valueChanges.subscribe((selectedValues) => {
      this.filterChanged.emit(selectedValues ?? []);
    });
  }
}
