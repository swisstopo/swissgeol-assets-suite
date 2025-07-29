import { Component, ElementRef, EventEmitter, NgZone, Output, inject, DOCUMENT } from '@angular/core';
import { Observable, distinctUntilChanged, fromEvent, map, merge, of, share, switchMap } from 'rxjs';

export type DragHandleOffset = { offsetX: number; offsetY: number } | null;

@Component({
  selector: 'asset-sg-drag-handle',
  templateUrl: './drag-handle.component.html',
  styleUrls: ['./drag-handle.component.scss'],
  standalone: true,
})
export class DragHandleComponent {
  private _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private _dcmnt = inject(DOCUMENT);
  private _ngZone = inject(NgZone);

  @Output() dragOffset$$ = new EventEmitter<Observable<DragHandleOffset>>();

  constructor() {
    this._ngZone.runOutsideAngular(() => {
      const mousedown$ = fromEvent<MouseEvent>(this._host.nativeElement, 'mousedown');
      const mouseup$ = fromEvent<MouseEvent>(this._dcmnt.body, 'mouseup');

      const isDragging$ = merge(mousedown$, mouseup$.pipe(map(() => null))).pipe(distinctUntilChanged(), share());

      isDragging$.subscribe((isDragging) => {
        if (isDragging) {
          this._host.nativeElement.classList.add('dragging');
        } else {
          this._host.nativeElement.classList.remove('dragging');
        }
      });

      const createMouseMoveOffset$ = (startMouseEvent: MouseEvent) => {
        const { pageX: startPageX, pageY: startPageY } = startMouseEvent;
        return fromEvent<MouseEvent>(this._dcmnt.body, 'mousemove').pipe(
          map((mouseEvent) => ({
            offsetX: mouseEvent.pageX - startPageX,
            offsetY: mouseEvent.pageY - startPageY,
          })),
        );
      };
      setTimeout(() => {
        this.dragOffset$$.next(
          isDragging$.pipe(switchMap((mouseEvent) => (mouseEvent ? createMouseMoveOffset$(mouseEvent) : of(null)))),
        );
      });
    });
  }
}
