import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawControl } from './draw-controls';
import { ZoomControl } from './zoom-control';

@Component({
  selector: 'asset-sg-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrl: './map-controls.component.scss',
})
export class MapControlsComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  zoom!: ZoomControl;

  @Input({ required: true })
  draw!: DrawControl;

  isDrawing = false;

  private readonly subscription = new Subscription();

  ngOnInit(): void {
    this.subscription.add(
      this.draw.isDrawing$.subscribe((isDrawing) => {
        this.isDrawing = isDrawing;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
