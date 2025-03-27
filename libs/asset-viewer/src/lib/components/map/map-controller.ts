import { olCoordsFromLV95, SWISS_CENTER, SWISS_EXTENT } from '@asset-sg/client-shared';
import { AssetEditDetail, getCoordsFromStudy, Study } from '@asset-sg/shared';
import { buffer } from '@turf/buffer';
import { Control } from 'ol/control';
import { Coordinate } from 'ol/coordinate';
import { easeOut } from 'ol/easing';
import { containsExtent } from 'ol/extent';
import Feature from 'ol/Feature';
import { GeoJSON } from 'ol/format';
import { Geometry, LineString, Point, Polygon } from 'ol/geom';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import { Heatmap, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import OlMap from 'ol/Map';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { Cluster, Tile, Vector as VectorSource, XYZ } from 'ol/source';
import Style, { StyleFunction } from 'ol/style/Style';
import View from 'ol/View';
import { filter, fromEventPattern, map, Observable, ReplaySubject, switchMap } from 'rxjs';
import { AllStudyDTO } from '../../models';
import { CustomFeatureProperties } from '../../shared/map-configuration/custom-feature-properties.enum';
import { availableLayerStyles, defaultLayerStyle } from '../../shared/map-configuration/map-layer-styles';
import { interactionStyles } from '../../shared/map-configuration/styles/system-styles.map-layer-style';
import { wktToGeoJSON } from '../../state/asset-search/asset-search.selector';
import { mapAssetAccessToAccessType } from '../../utils/access-type';

export const INITIAL_RESOLUTION = 500;

export const DEFAULT_MAP_POSITION: MapPosition = {
  x: SWISS_CENTER[0],
  y: SWISS_CENTER[1],
  z: INITIAL_RESOLUTION,
};

/**
 * Buffer radius used to create selection/hover effects around study geometries.
 */
const BUFFER_RADIUS_IN_METERS = 100;

export class MapController {
  readonly layers: MapLayers;
  readonly sources: MapLayerSources;
  readonly assetsClick$: Observable<number[]>;
  readonly assetsHover$: Observable<number[]>;
  readonly positionChange$: Observable<[number, number, number]>;

  private readonly map: OlMap;
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

  private readonly requestedPosition$ = new ReplaySubject<Partial<MapPosition>>(1);
  private geoJsonHandler = new GeoJSON({
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  });

  constructor(element: HTMLElement, initialPosition: MapPosition) {
    const view = new View({
      projection: 'EPSG:3857',
      minResolution: 0.1,
      resolution: initialPosition.z,
      center: [initialPosition.x, initialPosition.y],
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

    this.assetsClick$ = this.makeAssetsClick$();
    this.assetsHover$ = this.makeAssetsHover$();
    this.positionChange$ = this.makePositionChange$();

    this.map.once('loadend', () => {
      this.isInitialized = true;
      if (this.activeAsset === null) {
        const zoom = view.getZoom();
        if (zoom != null) {
          view.setMinZoom(zoom);
        }
      }

      this.requestedPosition$.subscribe(this.setPositionImmediately.bind(this));
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
      studyFeature.setProperties({ [CustomFeatureProperties.SwisstopoType]: 'StudyPoint' });
      studyFeature.setProperties({ [CustomFeatureProperties.GeometryType]: study.geometryType });
      studyFeature.setProperties({ [CustomFeatureProperties.AccessType]: study.accessType });
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
    for (const asset of assets) {
      this.assetsById.set(asset.assetId, asset);
      for (const assetStudy of asset.studies) {
        const study: Study = { studyId: assetStudy.studyId, geom: wktToGeoJSON(assetStudy.geomText) };
        const feature = makeStudyFeature(study);
        feature.setProperties({
          [CustomFeatureProperties.GeometryType]: this.mapGeometryToGeometryType(feature.getGeometry()),
          [CustomFeatureProperties.AccessType]: mapAssetAccessToAccessType(asset),
        });
        features.push(feature);

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
    const features = asset.studies.flatMap((assetStudy) => {
      const study = { studyId: assetStudy.studyId, geom: wktToGeoJSON(assetStudy.geomText) };
      const studyFeature = makeStudyFeature(study);

      return this.bufferFeatureWithStyle(studyFeature, interactionStyles.hoveredPolygon);
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

      let existingFeature = this.sources.assets.getFeatureById(assetStudy.studyId);
      if (!existingFeature) {
        existingFeature = makeStudyFeature(study);
        existingFeature.setProperties({
          [CustomFeatureProperties.GeometryType]: this.mapGeometryToGeometryType(existingFeature.getGeometry()),
          [CustomFeatureProperties.AccessType]: mapAssetAccessToAccessType(asset),
        });
      }
      features.push(existingFeature);

      const bufferedFeature = this.bufferFeatureWithStyle(existingFeature, interactionStyles.selectedPolygon);
      features.push(bufferedFeature);

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
    if (this.activeAsset === null) {
      return;
    }
    this.resetActiveAssetStyle();
    this.activeAsset = null;
    this.sources.activeAsset.clear();
    this.layers.assets.setOpacity(1);
    this.layers.studies.setOpacity(1);
    window.requestAnimationFrame(() => {
      resetZoom(this.map.getView(), { isAnimated: true });
    });
  }

  setPosition(position: Partial<MapPosition>): void {
    this.requestedPosition$.next(position);
  }

  private setPositionImmediately(position: Partial<MapPosition>): void {
    const view = this.map.getView();
    const center = view.getCenter();
    if (center === undefined) {
      throw new Error("can't set position, view is not yet initialized.");
    }
    view.setCenter([position.x ?? center[0], position.y ?? center[1]]);
    if (position.z !== undefined) {
      view.setResolution(position.z);
    }
    this.map.render();
  }

  dispose(): void {
    this.map.dispose();
  }

  handleStyleChange(styleFunction: StyleFunction) {
    this.layers.studies.setStyle(styleFunction);
    this.layers.studies.changed();
    this.layers.assets.setStyle(styleFunction);
    this.layers.assets.changed();
    this.layers.activeAsset.setStyle(styleFunction);
    this.layers.activeAsset.changed();
  }

  private bufferFeatureWithStyle(feature: Feature, style: Style): Feature {
    const geoJson = this.geoJsonHandler.writeFeatureObject(feature);
    const buffered = buffer(geoJson, BUFFER_RADIUS_IN_METERS, { units: 'meters' });
    const bufferedFeature = this.geoJsonHandler.readFeature(buffered);
    bufferedFeature.setStyle(style);

    return bufferedFeature;
  }

  private makeLayers(): MapLayers {
    return {
      raster: new TileLayer({
        source: new XYZ({
          url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg`,
        }),
      }),
      heatmap: this.makeHeatmapLayer(),
      studies: makeSimpleLayer<Point>({ minZoom: 11, style: availableLayerStyles[defaultLayerStyle].styleFunction }),
      polygon: makeSimpleLayer(),
      assets: makeSimpleLayer({ style: availableLayerStyles[defaultLayerStyle].styleFunction }),
      activeAsset: makeSimpleLayer({ style: availableLayerStyles[defaultLayerStyle].styleFunction }),
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

  private makePositionChange$(): Observable<[number, number, number]> {
    return fromEventPattern((h) => this.map.getView().on('change:center', h)).pipe(
      map(() => {
        const center = this.map.getView().getCenter();
        const resolution = this.map.getView().getResolution();
        if (center === undefined || resolution === undefined) {
          return null;
        }
        return [...center, resolution] as [number, number, number];
      }),
      filter((it) => it !== null)
    );
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
    feature.setStyle(new Style(undefined));
  }

  private unhideFeature(feature: Feature): void {
    const previousStyle = feature.get('previousStyle');
    if (previousStyle == null) {
      return;
    }
    feature.setStyle(previousStyle);
    feature.unset('previousStyle');
  }

  private mapGeometryToGeometryType(geometry: Geometry | undefined) {
    if (!geometry) {
      throw new Error('No Geometry found.');
    }
    return geometry.getType() === 'LineString' ? 'Line' : geometry.getType();
  }
}

export interface MapPosition {
  x: number;
  y: number;
  z: number;
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

const makeStudyFeature = (study: Study): Feature => {
  const geometry = ((): Geometry => {
    switch (study.geom._tag) {
      case 'Point':
        return new Point(olCoordsFromLV95(study.geom.coord));
      case 'LineString':
        return new LineString(study.geom.coords.map(olCoordsFromLV95));
      case 'Polygon': {
        return new Polygon([study.geom.coords.map(olCoordsFromLV95)]);
      }
    }
  })();

  const feature = new Feature({ geometry });

  feature.setId(study.studyId);
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
