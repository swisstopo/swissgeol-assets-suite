import { Component, EventEmitter, Output } from '@angular/core';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { LetModule } from '@rx-angular/template/let';
import { ButtonComponent } from '../button';

@Component({
  standalone: true,
  selector: 'asset-sg-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  imports: [ButtonComponent, LetModule, SvgIconComponent],
})
export class PageHeaderComponent {
  @Output() public readonly backNavigation = new EventEmitter<void>();

  public click() {
    this.backNavigation.emit();
  }
}
