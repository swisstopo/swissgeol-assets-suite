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
import { AppState } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';
import { Store } from '@ngrx/store';
import { asapScheduler, filter, first, identity, skip, Subscription, switchMap } from 'rxjs';
import { AllStudyService } from '../../services/all-study.service';
import * as searchActions from '../../state/asset-search/asset-search.actions';
import {
  selectAssetSearchPolygon,
  selectAssetSearchResultData,
  selectCurrentAssetDetail,
} from '../../state/asset-search/asset-search.selector';
import { DrawControl } from '../map-controls/draw-controls';
import { ZoomControl } from '../map-controls/zoom-control';
import { MapController } from './map-controller';

@Component({
  selector: 'asset-sg-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
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

  private readonly store = inject(Store<AppState>);

  private controller!: MapController;

  controls!: {
    zoom: ZoomControl;
    draw: DrawControl;
  };

  isInitialized = false;

  private readonly allStudyService = inject(AllStudyService);

  private readonly subscription = new Subscription();

  constructor() {
    this.initializeEnd.subscribe(() => {
      this.isInitialized = true;
    });
  }

  ngAfterViewInit(): void {
    asapScheduler.schedule(() => {
      this.initializeMap();
    });
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

  private initializeMap(): void {
    this.controller = new MapController(this.mapElement.nativeElement);

    this.controls = {
      zoom: new ZoomControl({
        element: this.controlsElement.nativeElement,
      }),
      draw: new DrawControl({
        element: this.controlsElement.nativeElement,
        polygonSource: this.controller.sources.polygon,
      }),
    };

    this.controller.addControl(this.controls.zoom);
    this.controller.addControl(this.controls.draw);

    this.subscription.add(
      this.controller.assetsClick$.pipe(filter(() => !this.controls.draw.isDrawing)).subscribe(this.assetsClick)
    );
    this.subscription.add(this.controller.assetsHover$.subscribe(this.assetsHover));

    // Some bindings can be initialized only after the map has fully loaded,
    // since they modify the map's zoom level.
    this.initializeEnd.pipe(first()).subscribe(() => {
      this.initializePolygonBindings();
      this.initializeStoreBindings();
      this.handleHighlightedAssetIdChange();
    });

    const studies$ = this.allStudyService.getAllStudies().pipe(ORD.fromFilteredSuccess);
    this.subscription.add(
      studies$.subscribe((studies) => {
        this.controller.setStudies(studies);
      })
    );

    this.controller.isInitialized$
      .pipe(
        first(identity),
        switchMap(() => studies$)
      )
      .subscribe(() => this.initializeEnd.emit());
  }

  private initializeStoreBindings() {
    this.subscription.add(
      this.store.select(selectAssetSearchResultData).subscribe((assets) => {
        if (assets.length === 0) {
          this.controller.clearAssets();
          this.controller.layers.studies.setVisible(true);
          this.controller.layers.heatmap.setVisible(true);
        } else {
          this.controller.setAssets(assets);
          this.controller.layers.studies.setVisible(false);
          this.controller.layers.heatmap.setVisible(false);
        }
      })
    );

    this.subscription.add(
      this.store.select(selectCurrentAssetDetail).subscribe((asset) => {
        if (asset == null) {
          this.controller.clearActiveAsset();
        } else {
          this.controller.setActiveAsset(asset);
        }
      })
    );
  }

  private initializePolygonBindings(): void {
    this.subscription.add(
      this.store.select(selectAssetSearchPolygon).subscribe((polygon) => {
        this.controls.draw.setPolygon(polygon ?? null);
      })
    );
    this.controls.draw.polygon$.pipe(skip(1)).subscribe((polygon) => {
      this.store.dispatch(
        searchActions.searchByFilterConfiguration({
          filterConfiguration: { polygon: polygon ?? undefined },
        })
      );
    });
  }

  private handleHighlightedAssetIdChange() {
    if (this.highlightedAssetId == null) {
      this.controller.clearHighlightedAsset();
    } else {
      this.controller.setHighlightedAsset(this.highlightedAssetId);
    }
  }

  @HostBinding('class.is-loading')
  get isLoading(): boolean {
    return !this.isInitialized;
  }
}
