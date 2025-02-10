import { Component, Input } from '@angular/core';
import { ZoomControl } from './zoom-control';

@Component({
  selector: 'asset-sg-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.scss'],
  standalone: false,
})
export class MapControlsComponent {
  @Input({ required: true })
  zoom!: ZoomControl;
}
