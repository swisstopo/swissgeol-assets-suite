import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'asset-sg-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  standalone: true,
  imports: [SvgIconComponent, TranslateModule],
})
export class SearchInputComponent {
  @ViewChild('searchInput') public readonly inputRef!: ElementRef<HTMLInputElement>;
  @Output() searchTermChanged = new EventEmitter<string>();

  public changeSearchTerm(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchTermChanged.emit(searchTerm);
  }
}
