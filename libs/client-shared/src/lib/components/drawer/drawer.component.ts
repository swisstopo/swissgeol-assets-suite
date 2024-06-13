import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  NgZone,
  QueryList,
  inject,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { coalesceWith } from '@rx-angular/cdk/coalescing';
import { RxState } from '@rx-angular/state';
import * as A from 'fp-ts/Array';
import { pipe, tuple } from 'fp-ts/function';
import * as IO from 'fp-ts/IO';
import * as T from 'fp-ts/Task';
import { WINDOW } from 'ngx-window-token';
import {
  animationFrameScheduler,
  delay,
  interval,
  map,
  merge,
  observeOn,
  scan,
  startWith,
  switchMap,
  take,
} from 'rxjs';

import { LifecycleHooks, LifecycleHooksDirective } from '../../lifecycle-hooks';
import { setCssCustomProperty } from '../../utils';

import { DrawerPanelComponent } from './drawer-panel.component';

interface DrawerState {
  panels: Record<
    string,
    {
      drawPanel: DrawerPanelComponent;
      display: boolean;
    }
  >;
}

const initialState: DrawerState = {
  panels: {},
};

@UntilDestroy()
@Component({
  standalone: true,
  selector: 'asset-sg-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [LifecycleHooksDirective],
})
export class DrawerComponent extends RxState<DrawerState> {
  @ContentChildren(DrawerPanelComponent) private _panels!: QueryList<DrawerPanelComponent>;

  private _host = inject(ElementRef<HTMLElement>);
  private _lc = inject(LifecycleHooks);
  private _ngZone = inject(NgZone);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private _wndw = inject(WINDOW)!;

  constructor() {
    super();

    this.set(initialState);

    this._lc.afterViewInit$
      .pipe(
        take(1),
        switchMap(() => this._panels.changes.pipe(startWith(null))),
        map(() =>
          pipe(
            [...this._panels],
            A.mapWithIndex((i, p) => tuple(i, p))
          )
        ),
        switchMap((ps) =>
          merge(
            ...pipe(
              ps,
              A.map(([index, panel]) => panel._display$.pipe(map((display) => tuple(index, panel, display))))
            )
          )
        ),
        scan((acc, [index, panel, display]) => {
          const f = acc.filter(([i]) => i !== index);
          return [...f, tuple(index, panel, display)];
        }, [] as [number, DrawerPanelComponent, boolean][]),
        coalesceWith(interval(0)),
        delay(0),
        observeOn(animationFrameScheduler),
        switchMap((a) =>
          this._ngZone.runOutsideAngular(() =>
            program(
              this._wndw,
              this._host.nativeElement,
              a.map(([, p, display]) => ({
                display,
                widthPercentageOfViewPanel: p.getWidthPercentageOfViewPanel(),
                element: p._host.nativeElement,
              }))
            )()
          )
        )
      )
      .subscribe();
  }
}

const requestAnimationFrame = (wndw: Window) => () =>
  new Promise<void>((resolve) => wndw.requestAnimationFrame(() => resolve()));

const delayIO =
  (ms: number): T.Task<void> =>
  () =>
    new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

const freezeDrawerWidthAndSetPanelWidths = (
  drawerElement: HTMLElement,
  panels: { element: HTMLElement; display: boolean; widthPercentageOfViewPanel: number }[]
) => {
  drawerElement.style.width = `${drawerElement.clientWidth}px`;
  panels.forEach((p) =>
    setCssCustomProperty(p.element, [
      '--width-percentage-of-viewport',
      p.display ? String(p.widthPercentageOfViewPanel) : '0',
    ])
  );
};

const measurePanelsAndSetDrawerWidth =
  (
    drawerElement: HTMLElement,
    panels: { element: HTMLElement; display: boolean; widthPercentageOfViewPanel: number }[]
  ) =>
  () => {
    const newWidth = pipe(
      panels,
      A.map(({ element }) => element.clientWidth),
      A.reduce(0, (a, b) => a + b)
    );
    const promise = new Promise<void>((resolve) => {
      const handler = (e: TransitionEvent) => {
        if (e.propertyName === 'width') {
          drawerElement.removeEventListener('transitionend', handler);
          drawerElement.style.width = '';
          resolve();
        }
      };
      drawerElement.addEventListener('transitionend', handler);
    });
    drawerElement.style.width = `${newWidth}px`;
    drawerElement.style.paddingLeft = newWidth > 0 ? '1rem' : '0';
    return promise;
  };

const program = (
  wndw: Window,
  drawerElement: HTMLElement,
  panels: { element: HTMLElement; display: boolean; widthPercentageOfViewPanel: number }[]
) =>
  pipe(
    IO.of(freezeDrawerWidthAndSetPanelWidths(drawerElement, panels)),
    T.fromIO,
    T.chain(() => delayIO(0)),
    T.chain(() => requestAnimationFrame(wndw)),
    T.chain(() => measurePanelsAndSetDrawerWidth(drawerElement, panels))
  );
