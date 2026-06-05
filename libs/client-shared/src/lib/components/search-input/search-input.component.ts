import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'asset-sg-search-input',
  imports: [SvgIconComponent, TranslatePipe, FormsModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  readonly value = model('');
  readonly placeholderTranslationKey = input('search.textSearchFieldPlaceholder');
  readonly keydownEvent = output<KeyboardEvent>();
  readonly searchSubmit = output<string>();

  onKeydown(event: KeyboardEvent): void {
    this.keydownEvent.emit(event);
    if (event.key === 'Enter') {
      this.searchSubmit.emit(this.value());
    }
  }
}
