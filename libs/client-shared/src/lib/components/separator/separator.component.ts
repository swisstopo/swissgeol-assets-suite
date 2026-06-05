import { Component, HostBinding, signal } from '@angular/core';

export enum SeparatorOrientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

@Component({
  standalone: true,
  selector: 'asset-sg-separator',
  imports: [],
  templateUrl: './separator.component.html',
  styleUrl: './separator.component.scss',
})
export class SeparatorComponent {
  orientation = signal(SeparatorOrientation.Horizontal);

  @HostBinding('class')
  get activeClass(): unknown {
    return this.orientation();
  }
}
