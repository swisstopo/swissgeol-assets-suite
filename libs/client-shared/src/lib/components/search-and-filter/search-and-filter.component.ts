import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button';
import { SearchInputComponent } from '../search-input';

@Component({
  selector: 'asset-sg-search-and-filter',
  templateUrl: './search-and-filter.component.html',
  styleUrls: ['./search-and-filter.component.scss'],
  standalone: true,
  imports: [SvgIconComponent, TranslateModule, SearchInputComponent, ButtonComponent],
})
export class SearchAndFilterComponent {
  public shouldShowFilters = false;
  @ViewChild('searchInput') public readonly inputRef!: ElementRef<HTMLInputElement>;
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
