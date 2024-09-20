import { Component, Input } from '@angular/core';
import { ZoomControl } from './zoom-control';

@Component({
  selector: 'asset-sg-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrl: './map-controls.component.scss',
})
export class MapControlsComponent {
  @Input({ required: true })
  zoom!: ZoomControl;
}
