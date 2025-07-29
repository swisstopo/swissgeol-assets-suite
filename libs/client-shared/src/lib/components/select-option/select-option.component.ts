import { coerceBooleanProperty } from '@angular/cdk/coercion';

import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'asset-sg-select-option',
  imports: [MatSelectModule, ReactiveFormsModule, TranslateModule, FormsModule],
  templateUrl: './select-option.component.html',
  styleUrl: './select-option.component.scss',
})
export class SelectOptionComponent<T> {
  @Input({ required: true })
  value!: T;

  @Input({ transform: coerceBooleanProperty })
  isDisabled = false;

  @ViewChild('template')
  template!: TemplateRef<unknown>;
}
