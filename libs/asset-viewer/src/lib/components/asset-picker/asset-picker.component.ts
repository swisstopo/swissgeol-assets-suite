import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    Output,
    ViewChild,
    inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RxState } from '@rx-angular/state';
import * as O from 'fp-ts/Option';
import { WINDOW } from 'ngx-window-token';
import {
    Observable,
    Subject,
    distinctUntilChanged,
    filter,
    identity,
    map,
    merge,
    pairwise,
    scan,
    startWith,
    switchMap,
} from 'rxjs';

import { DragHandleOffset, getCssCustomPropertyNumberValue } from '@asset-sg/client-shared';

import { SearchAssetVM } from '../../state/asset-viewer.selectors';

interface AssetPickerState {
    assets: SearchAssetVM[];
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetPickerComponent extends RxState<AssetPickerState> {
    public show$ = this.select('show');
    public assets$ = this.select('assets');
    public currentAssetId$ = this.select('currentAssetId');
    private _wndw = inject<Window>(WINDOW);

    public closePicker$ = new Subject<void>();
    public dragHandleOffset$$ = new Subject<Observable<DragHandleOffset>>();

    private _host = inject<ElementRef<HTMLElement>>(ElementRef);
    private _ngZone = inject(NgZone);

    @ViewChild('pickerContainer') _pickerContainer!: ElementRef<HTMLElement>;

    @Input() set assets(assets$: Observable<SearchAssetVM[]>) {
        this.connect('assets', assets$);
    }
    @Input() set currentAssetId(currentAssetId$: Observable<O.Option<number>>) {
        this.connect('currentAssetId', currentAssetId$);
    }

    @Output('assetMouseOver') assetMouseOver$ = new EventEmitter<O.Option<number>>();

    constructor() {
        super();

        this.set(initialState);

        const getTransformXY = () => {
            const [, x, y] = this._wndw
                .getComputedStyle(this._pickerContainer.nativeElement)
                .transform.match(/matrix\([^,]*,[^,]*,[^,]*,[^,]*,\s*(-?\d+),\s*(-?\d+)\)/) || [0, 0, 0];
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
                                      fontSizePx:
                                          getCssCustomPropertyNumberValue(
                                              this._wndw,
                                              this._host.nativeElement,
                                              'font-size',
                                          ) * 16,
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
                    filter(as => as.length > 0),
                    map(() => true),
                ),
                this.currentAssetId$.pipe(
                    filter(O.isSome),
                    map(() => false),
                ),
                this.closePicker$.pipe(map(() => false)),
            ),
        );

        this.closePicker$.pipe(untilDestroyed(this)).subscribe(() => this.onAssetMouseOut());
    }

    public onAssetMouseOver(assetId: number) {
        this.assetMouseOver$.emit(O.some(assetId));
    }
    public onAssetMouseOut() {
        this.assetMouseOver$.emit(O.none);
    }
}
