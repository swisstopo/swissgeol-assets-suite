import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  Output,
  ViewChild,
} from '@angular/core';
import { DragHandleOffset, getCssCustomPropertyNumberValue } from '@asset-sg/client-shared';
import { AssetSearchResultItem } from '@asset-sg/shared/v2';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import * as O from 'fp-ts/Option';
import {
  distinctUntilChanged,
  filter,
  identity,
  map,
  merge,
  Observable,
  pairwise,
  scan,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { ViewerControllerService } from '../../services/viewer-controller.service';

interface AssetPickerState {
  assets: AssetSearchResultItem[];
  show: boolean;
  currentAssetId: O.Option<number>;
}

const initialState: AssetPickerState = {
  assets: [],
  show: false,
  currentAssetId: O.none,
};

@UntilDestroy()
@Component({
  selector: 'asset-sg-asset-picker',
  templateUrl: './asset-picker.component.html',
  styleUrls: ['./asset-picker.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetPickerComponent extends RxState<AssetPickerState> {
  private readonly viewerControllerService = inject(ViewerControllerService);

  public show$ = this.select('show');
  public assets$ = this.select('assets');
  public currentAssetId$ = this.select('currentAssetId');

  public closePicker$ = new Subject<void>();
  public dragHandleOffset$$ = new Subject<Observable<DragHandleOffset>>();

  private _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private _ngZone = inject(NgZone);
  private _store = inject(Store);

  @ViewChild('pickerContainer') _pickerContainer!: ElementRef<HTMLElement>;

  @Input() set assets(assets$: Observable<AssetSearchResultItem[]>) {
    this.connect('assets', assets$);
  }

  @Input() set currentAssetId(currentAssetId$: Observable<O.Option<number>>) {
    this.connect('currentAssetId', currentAssetId$);
  }

  @Output() assetMouseOver = new EventEmitter<number | null>();

  constructor() {
    super();

    this.set(initialState);

    const getTransformXY = () => {
      const REGEX = /matrix\([^,]*,[^,]*,[^,]*,[^,]*,\s*(-?\d+),\s*(-?\d+)\)/;
      const [, x, y] = REGEX.exec(window.getComputedStyle(this._pickerContainer.nativeElement).transform) || [0, 0, 0];
      return { transformX: +x, transformY: +y };
    };

    this.dragHandleOffset$$
      .pipe(
        switchMap(identity),
        distinctUntilChanged(),
        startWith(null),
        pairwise(),
        scan(
          (acc, [prevDragHandleOffset, dragHandleOffset]) => {
            const { hostRect, pickerContainerRect, fontSizePx, transformX, transformY } =
              prevDragHandleOffset == null
                ? {
                    hostRect: this._host.nativeElement.getBoundingClientRect(),
                    pickerContainerRect: this._pickerContainer.nativeElement.getBoundingClientRect(),
                    fontSizePx: getCssCustomPropertyNumberValue(window, this._host.nativeElement, 'font-size') * 16,
                    ...getTransformXY(),
                  }
                : acc;
            return { dragHandleOffset, fontSizePx, hostRect, pickerContainerRect, transformX, transformY };
          },
          {
            fontSizePx: 0,
            dragHandleOffset: null as DragHandleOffset | null,
            hostRect: null as DOMRect | null,
            pickerContainerRect: null as DOMRect | null,
            transformX: 0,
            transformY: 0,
          },
        ),
        untilDestroyed(this),
      )
      .subscribe(({ dragHandleOffset, hostRect, pickerContainerRect, fontSizePx, transformX, transformY }) => {
        this._ngZone.runOutsideAngular(() => {
          if (!dragHandleOffset) {
            this._pickerContainer.nativeElement.style.removeProperty('margin-left');
            this._pickerContainer.nativeElement.style.removeProperty('margin-right');
          } else {
            if (hostRect && pickerContainerRect) {
              const offsetX =
                pickerContainerRect.left + dragHandleOffset.offsetX <= hostRect.left + fontSizePx
                  ? hostRect.left - pickerContainerRect.left + transformX + fontSizePx + 1
                  : pickerContainerRect.right + dragHandleOffset.offsetX >= hostRect.right
                    ? hostRect.right - pickerContainerRect.right + transformX
                    : dragHandleOffset.offsetX + transformX;
              const offsetY =
                pickerContainerRect.top + dragHandleOffset.offsetY <= hostRect.top
                  ? hostRect.top - pickerContainerRect.top + transformY
                  : pickerContainerRect.bottom + dragHandleOffset.offsetY >= hostRect.bottom
                    ? hostRect.bottom - pickerContainerRect.bottom + transformY
                    : dragHandleOffset.offsetY + transformY;
              this._pickerContainer.nativeElement.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
            }
          }
        });
      });

    this.connect(
      'show',
      merge(
        this.assets$.pipe(
          filter((as) => as.length > 0),
          map(() => true),
        ),
        this.currentAssetId$.pipe(
          filter(O.isSome),
          map(() => false),
        ),
        this.closePicker$.pipe(map(() => false)),
      ),
    );

    this.closePicker$.pipe(untilDestroyed(this)).subscribe(() => this.assetMouseOver.emit(null));
  }

  public selectAndClose(assetId: number) {
    this.viewerControllerService.selectAsset(assetId);
    this.closePicker$.next();
  }
}
