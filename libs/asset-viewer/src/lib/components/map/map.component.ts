import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { arrayEqual, isNotNull } from '@asset-sg/core';
import { isEmptySearchQuery } from '@asset-sg/shared';
import { filterNullish } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, first, map, skip, Subscription, switchMap, take, withLatestFrom } from 'rxjs';
import { ViewerControllerService } from '../../services/viewer-controller.service';
import * as searchActions from '../../state/asset-search/asset-search.actions';
import { setMapPosition } from '../../state/asset-search/asset-search.actions';
import {
  selectSearchResults,
  selectCurrentAsset,
  selectMapPosition,
  selectStudies,
  selectSearchQuery,
} from '../../state/asset-search/asset-search.selector';
import { AppStateWithMapControl } from '../../state/map-control/map-control.reducer';
import { DrawControl } from '../map-controls/draw-controls';
import { ZoomControl } from '../map-controls/zoom-control';
import { DEFAULT_MAP_POSITION, MapController, MapPosition } from './map-controller';

@Component({
  selector: 'asset-sg-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: false,
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  /**
   * The id of an asset that should be highlighted.
   */
  @Input()
  highlightedAssetId: number | null = null;

  /**
   * Event emitted when one or more assets are clicked.
   * The event consists of an array containing the IDs of all clicked assets.
   *
   * Note that each event corresponds to a single click,
   * which might target multiple overlapping assets.
   *
   * Clicks that don't hit any assets don't emit an event.
   */
  @Output()
  readonly assetsClick = new EventEmitter<number[]>();

  /**
   * Event emitted when one or more assets are hovered.
   * The event consists of an array containing the IDs of all hovered assets.
   */
  @Output()
  readonly assetsHover = new EventEmitter<number[]>();

  /**
   * Event emitted once the map is fully initialized.
   */
  @Output()
  readonly initializeEnd = new EventEmitter<void>();

  @ViewChild('map', { static: true })
  mapElement!: ElementRef<HTMLDivElement>;

  @ViewChild('mapControls', { static: true })
  controlsElement!: ElementRef<HTMLElement>;

  private readonly store = inject(Store<AppStateWithMapControl>);
  private readonly viewerControllerService = inject(ViewerControllerService);

  private controller!: MapController;

  controls!: {
    zoom: ZoomControl;
    draw: DrawControl;
  };

  isInitialized = false;

  private timeoutForSetPosition: number | null = null;

  private readonly subscription = new Subscription();

  private publishedPosition = DEFAULT_MAP_POSITION;

  constructor() {
    this.initializeEnd.subscribe(() => {
      this.isInitialized = true;
    });
  }

  ngAfterViewInit(): void {
    // Set the initial map position by its stored value.
    const storedPosition$ = this.viewerControllerService.viewerReady$.pipe(
      switchMap(() => this.store.select(selectMapPosition))
    );

    storedPosition$.pipe(take(1)).subscribe((position) => {
      this.publishedPosition = position;
      this.initializeMap(position);
    });

    this.subscription.add(
      storedPosition$.pipe(skip(1)).subscribe((position) => {
        if (position === this.publishedPosition) {
          return;
        }
        if (this.timeoutForSetPosition !== null) {
          clearTimeout(this.timeoutForSetPosition);
          this.timeoutForSetPosition = null;
        }
        this.controller.setPosition(position);
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.controller == null) {
      return;
    }
    if ('highlightedAssetId' in changes) {
      this.handleHighlightedAssetIdChange();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.controller.dispose();
  }

  private initializeMap(initialPosition: MapPosition): void {
    this.controller = new MapController(this.mapElement.nativeElement, initialPosition);

    this.controls = {
      zoom: new ZoomControl({
        element: this.controlsElement.nativeElement,
      }),
      draw: new DrawControl({
        element: this.controlsElement.nativeElement,
        polygonSource: this.controller.sources.polygon,
        store: this.store,
      }),
    };

    this.controller.addControl(this.controls.zoom);
    this.controller.addControl(this.controls.draw);

    this.controls.draw.isDrawing$.subscribe((isDrawing) => {
      this.controller.setClickEnabled(!isDrawing);
    });

    this.subscription.add(this.controller.assetsClick$.subscribe(this.assetsClick));
    this.subscription.add(this.controller.assetsHover$.subscribe(this.assetsHover));
    this.subscription.add(this.controller.positionChange$.subscribe(this.handlePositionChange.bind(this)));

    // Some bindings can be initialized only after the map has fully loaded,
    // since they modify the map's zoom level.
    this.initializeEnd.pipe(first()).subscribe(() => {
      this.initializePolygonBindings();
      this.initializeStoreBindings();
      this.handleHighlightedAssetIdChange();
    });
    this.initializeEnd.emit();
  }

  private initializeStoreBindings() {
    this.subscription.add(
      this.store.select(selectSearchQuery).subscribe((query) => {
        this.controller.setShowHeatmap(isEmptySearchQuery(query));
      })
    );
    this.subscription.add(
      this.store.select(selectSearchResults).subscribe((results) => this.controller.setAssets(results.data))
    );

    this.subscription.add(
      this.store.select(selectCurrentAsset).subscribe((asset) => {
        if (asset == null) {
          this.controller.clearActiveAsset();
        } else {
          setTimeout(() => this.controller.setActiveAsset(asset));
        }
      })
    );

    this.subscription.add(
      this.store
        .select(selectStudies)
        .pipe(filter(isNotNull))
        .subscribe((studies) => this.controller.setStudies(studies))
    );
  }

  private initializePolygonBindings(): void {
    this.subscription.add(
      this.store
        .select(selectSearchQuery)
        .pipe(
          map((it) => it.polygon),
          distinctUntilChanged()
        )
        .subscribe((polygon) => {
          this.controls.draw.setPolygon(polygon ?? null);
        })
    );
    this.subscription.add(
      this.controls.draw.polygon$
        .pipe(
          filterNullish(),
          withLatestFrom(this.store.select(selectSearchQuery).pipe(map((query) => query.polygon))),
          filter(([polygon, storePolygon]) => !arrayEqual(polygon, storePolygon))
        )
        .subscribe(([polygon, _]) =>
          this.store.dispatch(
            searchActions.updateSearchQuery({
              query: { polygon: polygon },
            })
          )
        )
    );
  }

  private handleHighlightedAssetIdChange() {
    if (this.highlightedAssetId == null) {
      this.controller.clearHighlightedAsset();
    } else {
      this.controller.setHighlightedAsset(this.highlightedAssetId);
    }
  }

  private handlePositionChange(position: MapPosition): void {
    if (this.timeoutForSetPosition !== null) {
      clearTimeout(this.timeoutForSetPosition);
    }
    this.timeoutForSetPosition = setTimeout(() => {
      this.publishedPosition = position;
      this.store.dispatch(setMapPosition({ position }));
    }, 50);
  }

  @HostBinding('class.is-loading')
  get isLoading(): boolean {
    return !this.isInitialized;
  }
}
