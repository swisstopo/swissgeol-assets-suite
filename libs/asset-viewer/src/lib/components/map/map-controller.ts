import { featureStyles, makeRhombusImage, olCoordsFromLV95, SWISS_CENTER, SWISS_EXTENT } from '@asset-sg/client-shared';
import { isNotUndefined } from '@asset-sg/core';
import { AssetEditDetail, getCoordsFromStudy, Study } from '@asset-sg/shared';
import { Control } from 'ol/control';
import { Coordinate } from 'ol/coordinate';
import { easeOut } from 'ol/easing';
import { containsExtent } from 'ol/extent';
import Feature from 'ol/Feature';
import { Geometry, LineString, Point, Polygon } from 'ol/geom';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import { Heatmap, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import OlMap from 'ol/Map';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { Cluster, Tile, Vector as VectorSource, XYZ } from 'ol/source';
import { Circle } from 'ol/style';
import Style from 'ol/style/Style';
import View from 'ol/View';
import { distinctUntilChanged, filter, fromEventPattern, map, Observable, switchMap } from 'rxjs';
import { AllStudyDTO } from '../../models';
import { wktToGeoJSON } from '../../state/asset-search/asset-search.selector';

export const INITIAL_RESOLUTION = 500;

export class MapController {
  private readonly map: OlMap;

  readonly layers: MapLayers;
  readonly sources: MapLayerSources;

  readonly assetsClick$: Observable<number[]>;
  readonly assetsHover$: Observable<number[]>;

  /**
   * The id of all visible assets, mapped to their {@link AssetEditDetail} object.
   * @private
   */
  private readonly assetsById = new Map<number, AssetEditDetail>();

  /**
   * The IDs of all available studies, mapped to the id of the asset that they belong to.
   * @private
   */
  private readonly assetIdsByStudyId = new Map<string, number>();

  /**
   * The currently selected asset.
   * @private
   */
  private activeAsset: AssetEditDetail | null = null;

  /**
   * Whether clicking things on the map is currently allowed.
   * @private
   */
  private isClickEnabled = true;

  private showHeatmap = true;

  private isInitialized = false;

  constructor(element: HTMLElement) {
    const view = new View({
      projection: 'EPSG:3857',
      minResolution: 0.1,
      resolution: INITIAL_RESOLUTION,
      center: SWISS_CENTER,
      extent: SWISS_EXTENT,
      showFullExtent: true,
    });

    this.layers = this.makeLayers();
    this.sources = makeSources(this.layers);

    this.map = new OlMap({
      target: element,
      controls: [],
      layers: [
        this.layers.raster,
        this.layers.heatmap,
        this.layers.studies,
        this.layers.assets,
        this.layers.activeAsset,
        this.layers.polygon,
        this.layers.picker,
      ],
      view: view,
    });

    fromEventPattern((h) => view.on('change:resolution', h))
      .pipe(
        map(() => view.getZoom()),
        filter(isNotUndefined),
        map((zoom) => parseFloat(zoom.toFixed(3))),
        distinctUntilChanged()
      )
      .subscribe(this.handleZoomChange.bind(this));

    this.assetsClick$ = this.makeAssetsClick$();
    this.assetsHover$ = this.makeAssetsHover$();

    this.map.once('loadend', () => {
      this.isInitialized = true;
      if (this.activeAsset === null) {
        const zoom = view.getZoom();
        if (zoom != null) {
          view.setMinZoom(zoom);
        }
      }
    });
  }

  setShowHeatmap(showHeatmap: boolean): void {
    this.showHeatmap = showHeatmap;
    this.layers.heatmap.setVisible(showHeatmap);
    this.layers.studies.setVisible(showHeatmap);
  }

  setClickEnabled(isEnabled: boolean): void {
    this.isClickEnabled = isEnabled;
  }

  addControl(control: Control): void {
    this.map.addControl(control);
  }

  setStudies(studies: AllStudyDTO[]): void {
    this.assetIdsByStudyId.clear();
    const studyFeatures: Feature<Point>[] = Array(studies.length);
    const heatmapFeatures: Feature<Point>[] = Array(studies.length);

    for (let i = 0; i < studies.length; i++) {
      const study = studies[i];
      const geometry = new Point(olCoordsFromLV95(study.centroid));
      this.assetIdsByStudyId.set(study.studyId, study.assetId);

      const heatmapFeature = new Feature<Point>(geometry);
      heatmapFeature.setId(study.studyId);
      heatmapFeatures[i] = heatmapFeature;

      const studyFeature = new Feature<Point>(geometry);
      studyFeature.setId(study.studyId);
      studyFeature.setStyle(study.isPoint ? featureStyles.point : featureStyles.rhombus);
      studyFeature.setProperties({ 'swisstopo.type': 'StudyPoint' });
      studyFeatures[i] = studyFeature;
    }

    window.requestAnimationFrame(() => {
      this.sources.heatmap.clear();
      this.sources.heatmap.addFeatures(heatmapFeatures);

      this.sources.studies.clear();
      this.sources.studies.addFeatures(studyFeatures);
    });
  }

  setAssets(assets: AssetEditDetail[]): void {
    this.assetsById.clear();
    if (this.showHeatmap) {
      window.requestAnimationFrame(() => {
        this.sources.assets.clear();
      });
      return;
    }

    const features: Feature[] = [];
    const studies: Study[] = [];
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      this.assetsById.set(asset.assetId, asset);
      for (const assetStudy of asset.studies) {
        const study: Study = { studyId: assetStudy.studyId, geom: wktToGeoJSON(assetStudy.geomText) };
        features.push(
          makeStudyFeature(study, {
            point: featureStyles.bigPoint,
            polygon: featureStyles.polygon,
            lineString: featureStyles.lineString,
          })
        );
        const studyFeature = this.sources.studies.getFeatureById(study.studyId);
        if (studyFeature != null) {
          this.hideFeature(studyFeature);
        }
        studies.push(study);
      }
    }
    window.requestAnimationFrame(() => {
      this.sources.assets.clear();
      this.sources.assets.addFeatures(features);
      this.sources.picker.clear();
      if (this.isInitialized) {
        zoomToStudies(this.map, studies);
      }
    });
  }

  clearAssets(): void {
    this.assetsById.clear();
    window.requestAnimationFrame(() => {
      this.sources.assets.clear();
      this.sources.polygon.clear();
      this.sources.picker.clear();
      this.sources.studies.forEachFeature((feature) => {
        this.unhideFeature(feature);
      });
    });
  }

  setHighlightedAsset(assetId: number): void {
    const asset = this.assetsById.get(assetId);
    if (asset == null) {
      this.sources.picker.clear();
      return;
    }
    const features = asset.studies.map((assetStudy) => {
      const study = { studyId: assetStudy.studyId, geom: wktToGeoJSON(assetStudy.geomText) };
      return makeStudyFeature(study, {
        point: featureStyles.bigPointAssetHighlighted,
        polygon: featureStyles.polygonAssetHighlighted,
        lineString: featureStyles.lineStringAssetHighlighted,
      });
    });

    this.sources.picker.clear();
    this.sources.picker.addFeatures(features);
  }

  clearHighlightedAsset(): void {
    this.sources.picker.clear();
  }

  setActiveAsset(asset: AssetEditDetail): void {
    this.resetActiveAssetStyle();
    this.activeAsset = asset;

    this.sources.activeAsset.clear();
    this.layers.assets.setOpacity(0.5);
    this.layers.studies.setOpacity(0.5);

    const studies: Study[] = [];
    const features: Feature[] = [];
    for (const assetStudy of asset.studies) {
      const study = {
        ...assetStudy,
        geom: wktToGeoJSON(assetStudy.geomText),
      };
      studies.push(study);

      const feature = makeStudyFeature(study, {
        point: featureStyles.bigPointAsset,
        polygon: featureStyles.polygonAsset,
        lineString: featureStyles.lineStringAsset,
      });
      features.push(feature);

      const studyFeature = this.sources.studies.getFeatureById(study.studyId);
      if (studyFeature != null) {
        this.hideFeature(studyFeature);
      }
    }

    window.requestAnimationFrame(() => {
      this.sources.activeAsset.addFeatures(features);
      zoomToStudies(this.map, studies);
    });
  }

  clearActiveAsset(): void {
    this.resetActiveAssetStyle();
    this.activeAsset = null;
    this.sources.activeAsset.clear();
    this.layers.assets.setOpacity(1);
    this.layers.studies.setOpacity(1);
    window.requestAnimationFrame(() => {
      resetZoom(this.map.getView(), { isAnimated: true });
    });
  }

  dispose(): void {
    this.map.dispose();
  }

  private handleZoomChange(zoom: number): void {
    (featureStyles.point.getImage() as Circle).setRadius(zoom < 12 ? 4 : 4 * (zoom / 7.5));
    featureStyles.rhombus.setImage(makeRhombusImage(zoom < 12 ? 5 : 5 * (zoom / 7.5)));
  }

  private makeLayers(): MapLayers {
    return {
      raster: new TileLayer({
        source: new XYZ({
          url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg`,
        }),
      }),
      heatmap: this.makeHeatmapLayer(),
      studies: makeSimpleLayer<Point>({ minZoom: 11 }),
      polygon: makeSimpleLayer(),
      assets: makeSimpleLayer(),
      activeAsset: makeSimpleLayer(),
      picker: makeSimpleLayer(),
    };
  }

  private makeHeatmapLayer(): MapLayer<Point> {
    const source = new VectorSource({ wrapX: false });
    const cluster = new Cluster({
      distance: 2,
      source: source,
    }) as unknown as VectorSource<Point>;

    return new Heatmap({
      source: cluster,
      weight: (feature) => (feature.get('features') == null ? 0 : 1),
      maxZoom: 12,
      blur: 20,
      radius: 5,
      opacity: 0.7,
    }) as MapLayer<Point>;
  }

  /**
   * Creates an observable that emits the ids of assets whose geometries have been clicked.
   *
   * - If a study point has been clicked, that study's assetId is emitted as the only clicked element.
   * - Otherwise, the assetIds of all overlapping studies hit by the click are emitted.
   *
   * @private
   */
  private makeAssetsClick$(): Observable<number[]> {
    return fromEventPattern<MapBrowserEvent<PointerEvent>>(
      (h) => this.map.on('click', h),
      (h) => this.map.un('click', h)
    ).pipe(
      filter(() => this.isClickEnabled),

      // Check if the click has hit a study point, and use only that point if so.
      switchMap(async (event) => {
        let assetId: number | null = null;
        this.map.forEachFeatureAtPixel(
          event.pixel,
          (feature): void => {
            if (assetId != null) {
              return;
            }
            const featureId = feature.getId();
            if (featureId == null) {
              return;
            }
            const currentAssetId = this.assetIdsByStudyId.get(`${featureId}`);
            if (currentAssetId != null) {
              assetId = currentAssetId;
            }
          },
          {
            layerFilter: (layer) => layer === this.layers.studies,
          }
        );
        return [event, assetId] as const;
      }),

      map(([event, assetIdFromStudy]) => {
        // Use the study point's asset if one has been clicked.
        if (assetIdFromStudy != null) {
          return [assetIdFromStudy];
        }

        // Otherwise, extract the assetIds of all overlapping study geometries that have been clicked.
        const assetIds = new Set<number>();
        this.map.forEachFeatureAtPixel(
          event.pixel,
          (feature): void => {
            const featureId = feature.getId();
            if (featureId == null) {
              return;
            }
            const assetId = this.assetIdsByStudyId.get(`${featureId}`);
            if (assetId != null) {
              assetIds.add(assetId);
            }
          },
          {
            layerFilter: (layer) => layer === this.layers.assets,
          }
        );
        return [...assetIds];
      })
    );
  }

  private makeAssetsHover$(): Observable<number[]> {
    return fromEventPattern<MapBrowserEvent<PointerEvent>>(
      (h) => this.map.on('pointermove', h),
      (h) => this.map.un('pointermove', h)
    ).pipe(
      switchMap((event) => this.layers.assets.getFeatures(event.pixel)),

      // Extract the ids of the assets that have been hovered.
      map((features) => {
        const viewExtent = this.map.getView().calculateExtent(this.map.getSize());
        const assetIds: number[] = [];
        for (const feature of features) {
          const featureId = feature.getId();
          if (featureId == null) {
            continue;
          }

          // Ignore geometries that fill up the entire view.
          const geometry = feature.getGeometry();
          if (geometry != null && containsExtent(geometry.getExtent(), viewExtent)) {
            continue;
          }

          const assetId = this.assetIdsByStudyId.get(`${featureId}`);
          if (assetId != null) {
            assetIds.push(assetId);
          }
        }
        return assetIds;
      })
    );
  }

  private resetActiveAssetStyle(): void {
    // If we have no active asset, or if the active asset is also contained in the currently visible assets,
    // then we either can't or don't need to show the asset's study points.
    if (this.activeAsset == null || this.assetsById.has(this.activeAsset.assetId)) {
      return;
    }
    for (const study of this.activeAsset.studies) {
      const feature = this.sources.studies.getFeatureById(study.studyId);
      if (feature != null) {
        this.unhideFeature(feature);
      }
    }
  }

  private hideFeature(feature: Feature): void {
    feature.set('previousStyle', feature.getStyle());
    feature.setStyle(featureStyles.hidden);
  }

  private unhideFeature(feature: Feature): void {
    const previousStyle = feature.get('previousStyle');
    if (previousStyle == null) {
      return;
    }
    feature.setStyle(previousStyle);
    feature.unset('previousStyle');
  }
}

interface MapLayers {
  /**
   * The actual map.
   */
  raster: TileLayer<Tile>;

  /**
   * A heatmap of studies.
   */
  heatmap: MapLayer<Point>;

  /**
   * A layer displaying a single point for each study.
   * Only shown when zooming in close enough.
   */
  studies: MapLayer<Point>;

  /**
   * A layer displaying the geometries of all visible assets.
   */
  assets: MapLayer;

  /**
   * A layer displaying the geometries of the currently selected asset.
   * This allows all other visible assets to be transparent
   * while the selected one stays fully opaque.
   */
  activeAsset: MapLayer;

  /**
   * The currently drawn polygon.
   */
  polygon: MapLayer;

  picker: MapLayer;
}

type MapLayerSources = {
  [K in keyof MapLayers]: MapLayers[K] extends { getSource(): infer S | null } ? S : never;
};

type MapLayer<G extends Geometry = Geometry> = VectorLayer<VectorSource<G>>;

type LayerOptions = ConstructorParameters<typeof VectorLayer>[0];

const makeSimpleLayer = <G extends Geometry = Geometry>(options: LayerOptions = {}): MapLayer<G> =>
  new VectorLayer({
    ...options,
    source: new VectorSource({ wrapX: false }),
  }) as MapLayer<G>;

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
  assets: requireSource(layers.assets),
  activeAsset: requireSource(layers.activeAsset),
  picker: requireSource(layers.picker),
});

const makeStudyFeature = (study: Study, styles: { point: Style; polygon: Style; lineString: Style }): Feature => {
  const [geometry, style] = ((): [Geometry, Style] => {
    switch (study.geom._tag) {
      case 'Point':
        return [new Point(olCoordsFromLV95(study.geom.coord)), styles.point];
      case 'LineString':
        return [new LineString(study.geom.coords.map(olCoordsFromLV95)), styles.lineString];
      case 'Polygon': {
        const polygon = new Polygon([study.geom.coords.map(olCoordsFromLV95)]);
        const style = styles.polygon.clone();
        style.setZIndex((style.getZIndex() ?? 0) + 1 / polygon.getArea());
        return [polygon, style];
      }
    }
  })();

  const feature = new Feature({ geometry });

  feature.setId(study.studyId);
  feature.setStyle(style);
  feature.setProperties({ 'swisstopo.type': 'StudyGeometry' });
  return feature;
};

const zoomToStudies = (map: OlMap, studies: Study[]): void => {
  if (studies.length === 0) {
    return;
  }

  const view = map.getView();
  const size = map.getSize();
  const oldCenter = view.getCenter();
  const oldZoom = view.getZoom();

  if (size == null) {
    return;
  }

  if (studies.length === 1 && studies[0].geom._tag === 'Point') {
    const coord = olCoordsFromLV95(studies[0].geom.coord);
    view.setZoom(18);
    view.centerOn(coord, size, [size[0] * 0.5, size[1] / 2]);
  } else {
    const extent = {
      min: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
      max: { x: Number.MIN_VALUE, y: Number.MIN_VALUE },
    };

    for (const study of studies) {
      const lv95Coords = getCoordsFromStudy(study);
      for (const lv95Coord of lv95Coords) {
        const [x, y] = olCoordsFromLV95(lv95Coord);
        if (extent.min.x > x) {
          extent.min.x = x;
        }
        if (extent.min.y > y) {
          extent.min.y = y;
        }
        if (extent.max.x < x) {
          extent.max.x = x;
        }
        if (extent.max.y < y) {
          extent.max.y = y;
        }
      }
    }

    const horizontalPadding = size[0] * 0.1;
    const verticalPadding = size[1] * 0.1;
    const polygon = polygonFromExtent([extent.min.x, extent.min.y, extent.max.x, extent.max.y]);
    view.fit(polygon, {
      padding: [verticalPadding, horizontalPadding, verticalPadding, horizontalPadding],
      maxZoom: 18,
    });
  }

  const newCenter = view.getCenter();
  const newZoom = view.getZoom();
  if (oldCenter != null) {
    view.setCenter(oldCenter);
  }
  if (oldZoom != null) {
    view.setZoom(oldZoom);
  }
  if (newCenter != null && newZoom != null) {
    zoomToCenter(map, { center: newCenter, zoom: newZoom });
  }
};

const zoomToCenter = (map: OlMap, { center, zoom }: { center: Coordinate; zoom: number }): void => {
  window.requestAnimationFrame(() => {
    map.getView().animate({ center, zoom, duration: 600 });
  });
};

export const resetZoom = (view: View, options: { isAnimated?: boolean } = {}): void => {
  if (options.isAnimated) {
    view.animate({
      resolution: INITIAL_RESOLUTION,
      center: SWISS_CENTER,
      duration: 250,
      easing: easeOut,
    });
  } else {
    view.setResolution(INITIAL_RESOLUTION);
    view.setCenter(SWISS_CENTER);
  }
};
