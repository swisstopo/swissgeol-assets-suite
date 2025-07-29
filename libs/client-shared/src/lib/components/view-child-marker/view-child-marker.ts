import { Directive, Input, ViewContainerRef, inject } from '@angular/core';

@Directive({
  selector: '[viewChildMarker]',
  standalone: true,
})
 
export class ViewChildMarker {
  @Input() public viewChildMarker!: unknown;
  @Input() public viewChildMarkerContext: unknown;

  public viewContainerRef = inject(ViewContainerRef);
}
