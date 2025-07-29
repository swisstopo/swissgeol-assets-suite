import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';

import { ButtonComponent } from '../button';

let uniqueId = 0;
@Component({
  standalone: true,
  selector: 'asset-sg-map-zoom-controls',
  templateUrl: './zoom-controls.component.html',
  styleUrls: ['zoom-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgIconComponent, ButtonComponent, TranslateModule],
})
export class ZoomControlsComponent implements OnDestroy {
  public readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  @ViewChild('drawModeCheckbox') private drawModeCheckbox!: ElementRef<HTMLInputElement>;

  public _zoomPlusClicked$ = new Subject<Event>();
  public readonly zoomPlusClicked$: Observable<Event> = this._zoomPlusClicked$;

  public _zoomOriginClicked$ = new Subject<Event>();
  public readonly zoomOriginClicked$: Observable<Event> = this._zoomOriginClicked$;

  public _zoomMinusClicked$ = new Subject<Event>();
  public readonly zoomMinusClicked$: Observable<Event> = this._zoomMinusClicked$;

  public drawingModelLabel = `asset-sg-map-zoom-controls--drawing-mode--${uniqueId++}`;

  public setDrawingMode(value: boolean) {
    this.drawModeCheckbox.nativeElement.checked = value;
    this._drawingMode$.next(value);
  }

  ngOnDestroy(): void {
    this._zoomPlusClicked$.complete();
    this._zoomOriginClicked$.complete();
    this._zoomMinusClicked$.complete();
  }

  public _drawingMode$ = new Subject<boolean>();
  public drawingMode$ = this._drawingMode$.asObservable();

  drawingModeChangedHandler(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._drawingMode$.next(target.checked);
  }
}
