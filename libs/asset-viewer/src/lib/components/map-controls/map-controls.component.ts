import { Component, Input } from '@angular/core';
import { DrawControl } from './draw-controls';
import { ZoomControl } from './zoom-control';

@Component({
  selector: 'asset-sg-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrl: './map-controls.component.scss',
})
export class MapControlsComponent {
  @Input({ required: true })
  zoom!: ZoomControl;

  @Input({ required: true })
  draw!: DrawControl;
}
