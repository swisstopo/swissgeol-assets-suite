import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button';
import { TextInputComponent } from '../text-input';

@Component({
  selector: 'asset-sg-search-and-filter',
  templateUrl: './search-and-filter.component.html',
  styleUrls: ['./search-and-filter.component.scss'],
  standalone: true,
  imports: [SvgIconComponent, TranslateModule, TextInputComponent, ButtonComponent, FormsModule],
})
export class SearchAndFilterComponent {
  public shouldShowFilters = false;
  @Output() searchTermChanged = new EventEmitter<string>();
  @Output() shouldShowFiltersChanged = new EventEmitter<boolean>();

  public toggleFilters(): void {
    this.shouldShowFilters = !this.shouldShowFilters;
    this.shouldShowFiltersChanged.emit(this.shouldShowFilters);
  }

  public changeSearchTerm(searchTerm: string): void {
    this.searchTermChanged.emit(searchTerm);
  }
}
