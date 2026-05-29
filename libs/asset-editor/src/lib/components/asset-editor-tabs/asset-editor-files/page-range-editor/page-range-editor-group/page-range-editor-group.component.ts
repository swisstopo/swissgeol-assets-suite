import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SelectComponent } from '@asset-sg/client-shared';
import { PageCategory, SupportedPageLanguage } from '@asset-sg/shared/v2';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';
import type { PageClassificationFormGroup, SelectOption } from '../page-range-editor.component';

@Component({
  selector: 'asset-sg-page-range-editor-group',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateDirective,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    SelectComponent,
    SgcButton,
    SgcIcon,
  ],
  templateUrl: './page-range-editor-group.component.html',
  styleUrl: './page-range-editor-group.component.scss',
})
export class PageRangeEditorGroupComponent {
  public readonly group = input.required<PageClassificationFormGroup>();
  public readonly categories = input.required<SelectOption<PageCategory>[]>();
  public readonly languages = input.required<SelectOption<SupportedPageLanguage>[]>();
  public readonly availablePages = input.required<number[]>();
  public readonly expanded = input.required<boolean>();

  public readonly toggled = output<void>();
  public readonly removed = output<void>();

  protected getHeaderLabel(): string {
    const label = this.group().controls.label.value?.trim();
    if (label) {
      return label;
    }
    return this.getTypeSummary();
  }

  protected getTypeSummary(): string {
    const categories = this.group().controls.categories.value;
    if (categories.length === 0) {
      return '-';
    }
    return categories.map((category) => this.translateCategory(category)).join(', ');
  }

  protected getLanguageSummary(): string {
    const languages = this.group().controls.languages.value;
    if (languages.length === 0) {
      return '-';
    }
    return languages.map((language) => language.toUpperCase()).join(', ');
  }

  protected getPageSummary(): string {
    const from = this.group().controls.from.value;
    const to = this.group().controls.to.value;
    return from === to ? `P. ${from}` : `P. ${from} - ${to}`;
  }

  protected toggleGroup() {
    this.toggled.emit();
  }

  protected removeGroup(event: Event) {
    event.stopPropagation();
    this.removed.emit();
  }

  private translateCategory(category: PageCategory): string {
    return this.categories().find((item) => item.value === category)?.label ?? category;
  }
}
