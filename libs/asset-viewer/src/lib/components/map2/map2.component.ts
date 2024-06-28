import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  inject,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  AppState,
  featureStyles,
  fitToSwitzerland,
  olCoordsFromLV95,
  WindowService,
  zoomToStudies,
} from '@asset-sg/client-shared';
import { isNil, isNotNil, isNotNull, ORD } from '@asset-sg/core';
import { AssetEditDetail, LV95, Study } from '@asset-sg/shared';
import { Store } from '@ngrx/store';
import Collection from 'ol/Collection';
import { Control } from 'ol/control';
import Feature from 'ol/Feature';
import { Geometry, LineString, Point, Polygon } from 'ol/geom';
import { Heatmap, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import { Cluster, Tile, Vector as VectorSource, XYZ } from 'ol/source';
import { Icon } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import Style from 'ol/style/Style';
import View from 'ol/View';
import {
  asyncScheduler,
  combineLatest,
  combineLatestWith,
  filter,
  first,
  fromEventPattern,
  map,
  Observable,
  ReplaySubject,
  Subscription,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { AllStudyDTO } from '../../models';
import { AllStudyService } from '../../services/all-study.service';
import {
  selectCurrentAssetDetail,
  selectStudies,
  StudyVM,
  wktToGeoJSON,
} from '../../state/asset-search/asset-search.selector';
import { DrawControl } from '../map-controls/draw-controls';
import { ZoomControl } from '../map-controls/zoom-control';

@Component({
  selector: 'asset-sg-map2',
  templateUrl: './map2.component.html',
  styleUrl: './map2.component.scss',
})
export class Map2Component implements OnInit, AfterViewInit, OnDestroy {
  @Output()
  readonly initializeEnd = new EventEmitter<void>();

  @Output()
  public polygonChange = new EventEmitter<LV95[]>();

  @ViewChild('map', { static: true })
  mapElement!: ElementRef<HTMLDivElement>;

  @ViewChild('mapControls', { static: true })
  controlsElement!: ElementRef<HTMLElement>;

  private readonly store = inject(Store<AppState>);

  private map!: Map;

  private layers!: MapLayers;

  private sources!: MapLayerSources;

  controls!: {
    zoom: ZoomControl;
    draw: DrawControl;
  };

  isInitialized = false;

  private readonly allStudyService = inject(AllStudyService);

  private studies$!: Observable<MapStudy[]>;
  private selectedStudies$ = this.store.select(selectStudies);
  private currentAsset$ = this.store.select(selectCurrentAssetDetail);

  private readonly subscription = new Subscription();

  constructor() {
    this.initializeEnd.subscribe(() => {
      this.isInitialized = true;
    });
  }

  ngOnInit(): void {
    this.studies$ = this.allStudyService.getAllStudies().pipe(
      ORD.fromFilteredSuccess,
      map((studies) =>
        studies.map((study) => ({
          study,
          geometry: new Point(olCoordsFromLV95(study.centroid)),
        }))
      )
    );
  }

  ngAfterViewInit(): void {
    asyncScheduler.schedule(() => {
      this.initializeMap();
    });
  }

  ngOnDestroy(): void {
    this.map.dispose();
    this.subscription.unsubscribe();
  }

  private initializeMap(): void {
    const view = new View({
      center: [900000, 5900000],
      zoom: 9,
      projection: 'EPSG:3857',
      minZoom: 7,
    });

    this.layers = this.makeLayers();
    this.sources = makeSources(this.layers);

    this.controls = {
      zoom: new ZoomControl({
        element: this.controlsElement.nativeElement,
      }),
      draw: new DrawControl({
        element: this.controlsElement.nativeElement,
        polygonSource: this.sources.polygon,
      }),
    };
    this.controls.draw.polygon$.pipe(filter(isNotNull)).subscribe((polygon) => {
      this.polygonChange.emit(polygon);
    });

    this.map = new Map({
      target: this.mapElement.nativeElement,
      controls: new Collection<Control>([this.controls.zoom, this.controls.draw]),
      layers: [
        this.layers.raster,
        this.layers.heatmap,
        // this.layers.studies,
        this.layers.geometries,
        this.layers.assets,
        this.layers.polygon,
        this.layers.picker,
      ],
      view: view,
    });

    view.on('change:resolution', this.handleResolutionChange.bind(this));

    this.subscription.add(this.selectedStudies$.subscribe(this.handleSelectionChange.bind(this)));

    this.subscription.add(
      this.currentAsset$.pipe(filter(isNotNil)).subscribe((currentAsset) => {
        this.sources.assets.clear();
        this.layers.geometries.setOpacity(0.5);
        this.layers.studies.setOpacity(0.5);

        const studies = currentAsset.studies.map((study) => ({
          ...study,
          geom: wktToGeoJSON(study.geomText),
        }));
        zoomToStudies(null as unknown as WindowService, this.map, studies, 1);

        this.sources.assets.addFeatures(
          studies.map((study) =>
            makeStudyFeature(study, {
              point: featureStyles.bigPointStyleAsset,
              polygon: featureStyles.polygonStyleAsset,
              lineString: featureStyles.lineStringStyleAsset,
            })
          )
        );
      })
    );

    this.subscription.add(
      this.currentAsset$.pipe(filter(isNil)).subscribe(() => {
        this.sources.assets.clear();
        this.layers.geometries.setOpacity(1);
        this.layers.studies.setOpacity(1);
      })
    );

    this.subscription.add(
      combineLatest([fromEventPattern((handle) => this.map.once('loadend', handle)), this.studies$])
        .pipe(first())
        .subscribe(() => {
          fitToSwitzerland(view, false);
          const zoom = view.getZoom();
          if (zoom != null) {
            view.setMinZoom(zoom);
          }
          this.initializeEnd.emit();
        })
    );
  }

  private handleResolutionChange(): void {
    const zoom = this.map.getView().getZoom();
    if (zoom == null) {
      return;
    }
    this.layers.studies.getSource()?.forEachFeature((feature) => {
      const style = feature.getStyle();
      if (!(style instanceof Style)) {
        return;
      }
      const image = style.getImage();
      if (image instanceof Icon) {
        image.setScale(zoom < 12 ? 1 : zoom / 7.5);
      }
      if (image instanceof CircleStyle) {
        image.setRadius(zoom < 12 ? 4 : 4 * (zoom / 7.5));
      }
    });
  }

  private handleSelectionChange(selectedStudies: StudyVM[]): void {
    this.sources.geometries.clear();
    if (selectedStudies.length === 0) {
      this.sources.polygon.clear();
      this.sources.studies.forEachFeature((feature) => {
        const previousStyle = feature.get('previousStyle');
        if (previousStyle == null) {
          return;
        }
        feature.setStyle(previousStyle);
        feature.unset('previousStyle');
      });
      return;
    }

    for (const study of selectedStudies) {
      this.sources.geometries.addFeature(
        makeStudyFeature(study, {
          point: featureStyles.bigPointStyle,
          polygon: featureStyles.polygonStyle,
          lineString: featureStyles.lineStringStyle,
        })
      );
    }

    // TODO rewrite this + remove WindowService
    zoomToStudies(null as unknown as WindowService, this.map, selectedStudies, 1);
  }

  private makeLayers(): MapLayers {
    return {
      raster: new TileLayer({
        source: new XYZ({
          url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg`,
        }),
      }),
      heatmap: this.makeHeatmapLayer(),
      studies: this.makeStudyLayer(),
      polygon: makeSimpleLayer(),
      geometries: makeSimpleLayer(),
      assets: makeSimpleLayer(),
      picker: makeSimpleLayer(),
    };
  }

  private makeHeatmapLayer(): MapLayer<Point> {
    const source = new VectorSource({ wrapX: false });
    const cluster = new Cluster({
      distance: 2,
      source: source,
    }) as unknown as VectorSource<Point>;

    this.subscription.add(
      this.studies$.subscribe((studies) => {
        const features = studies.map((study) => new Feature({ geometry: study.geometry }));
        window.requestAnimationFrame(() => {
          source.addFeatures(features);
        });
      })
    );

    return new Heatmap({
      source: cluster,
      weight: (feature) => (feature.get('features') == null ? 0 : 1),
      maxZoom: 12,
      blur: 20,
      radius: 5,
      opacity: 0.7,
    }) as MapLayer<Point>;
  }

  private makeStudyLayer(): MapLayer {
    const layer = makeSimpleLayer({ minZoom: 11 }) as MapLayer;
    this.subscription.add(
      this.studies$.subscribe((studies) =>
        window.requestAnimationFrame(() => {
          const source = requireSource(layer);
          source.clear();
          source.addFeatures(
            studies.map(({ study, geometry }) => {
              const feature = new Feature({ geometry });
              feature.setId(study.studyId);
              feature.setStyle(study.isPoint ? featureStyles.pointStyle : featureStyles.rhombusStyle);
              return feature;
            })
          );
        })
      )
    );
    this.subscription.add(
      this.studies$.pipe(switchMap(() => this.selectedStudies$)).subscribe((selectedStudies) => {
        window.requestAnimationFrame(() => {
          for (const study of selectedStudies) {
            const source = requireSource(layer);
            const feature = source.getFeatureById(study.studyId);
            if (feature == null) {
              console.warn('no feature found for study', { studyId: study.studyId });
              continue;
            }
            feature.set('previousStyle', feature.getStyle());
            feature.setStyle(featureStyles.undefinedStyle);
          }
        });
      })
    );
    return layer;
  }

  @HostBinding('class.is-loading')
  get isLoading(): boolean {
    return !this.isInitialized;
  }
}

interface MapLayers {
  raster: TileLayer<Tile>;
  heatmap: MapLayer<Point>;
  studies: MapLayer;
  polygon: MapLayer;
  geometries: MapLayer;
  assets: MapLayer;
  picker: MapLayer;
}

type MapLayerSources = {
  [K in keyof MapLayers]: MapLayers[K] extends { getSource(): infer S | null } ? S : never;
};

type MapLayer<G extends Geometry = Geometry> = VectorLayer<VectorSource<G>>;

interface MapStudy {
  study: AllStudyDTO;
  geometry: Point;
}

type LayerOptions = ConstructorParameters<typeof VectorLayer>[0];

const makeSimpleLayer = (options: LayerOptions = {}): MapLayer =>
  new VectorLayer({
    ...options,
    source: new VectorSource({ wrapX: false }),
  }) as MapLayer;

const requireSource = <S>(layer: { getSource(): S | null }): S => {
  const source = layer.getSource();
  if (source == null) {
    throw new Error('expected source to be present');
  }
  return source;
};

const makeSources = (layers: MapLayers): MapLayerSources => ({
  raster: requireSource(layers.raster),
  heatmap: requireSource(requireSource(layers.heatmap) as unknown as Cluster) as VectorSource<Point>,
  studies: requireSource(layers.studies),
  polygon: requireSource(layers.polygon),
  geometries: requireSource(layers.geometries),
  assets: requireSource(layers.assets),
  picker: requireSource(layers.picker),
});

const makeStudyFeature = (study: Study, styles: { point: Style; polygon: Style; lineString: Style }): Feature => {
  const [geometry, style] = ((): [Geometry, Style] => {
    switch (study.geom._tag) {
      case 'Point':
        return [new Point(olCoordsFromLV95(study.geom.coord)), styles.point];
      case 'LineString':
        return [new Polygon([study.geom.coords.map(olCoordsFromLV95)]), styles.polygon];
      case 'Polygon':
        return [new LineString(study.geom.coords.map(olCoordsFromLV95)), styles.lineString];
    }
  })();

  const feature = new Feature({ geometry });
  feature.setId(study.studyId);
  feature.setStyle(style);
  feature.setProperties({ assetSgFeatureType: study.geom._tag }); // TODO check if this is ever used.
  return feature;
};
