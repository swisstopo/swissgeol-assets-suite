import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'asset-sg-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  standalone: true,
})
export class SearchInputComponent {
  @ViewChild('searchInput') public readonly inputRef!: ElementRef<HTMLInputElement>;
  @Output() searchTermChanged = new EventEmitter<string>();

  public changeSearchTerm(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchTermChanged.emit(searchTerm);
  }
}
