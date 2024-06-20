import { Directive, Input, ViewContainerRef, inject } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[viewChildMarker]',
  standalone: true,
})
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class ViewChildMarker {
  @Input() public viewChildMarker!: unknown;
  @Input() public viewChildMarkerContext: unknown;

  public viewContainerRef = inject(ViewContainerRef);
}
