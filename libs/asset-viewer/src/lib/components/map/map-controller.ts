import { olCoordsFromCoordinate, SWISS_CENTER, SWISS_EXTENT } from '@asset-sg/client-shared';
import {
  AssetId,
  AssetSearchResultItem,
  extend,
  Geometry,
  GeometryDetail,
  GeometryId,
  GeometryType,
} from '@asset-sg/shared/v2';
import { buffer } from '@turf/buffer';
import { Control } from 'ol/control';
import { Coordinate } from 'ol/coordinate';
import { easeOut } from 'ol/easing';
import { containsExtent } from 'ol/extent';
import Feature from 'ol/Feature';
import { GeoJSON } from 'ol/format';
import { Geometry as OlGeometry, LineString, Point, Polygon } from 'ol/geom';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import { Heatmap, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import OlMap from 'ol/Map';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { Cluster, Tile, Vector as VectorSource, XYZ } from 'ol/source';
import Style, { StyleFunction } from 'ol/style/Style';
import View from 'ol/View';
import { filter, fromEventPattern, map, Observable, ReplaySubject, switchMap } from 'rxjs';
import { CustomFeatureProperties } from '../../shared/map-configuration/custom-feature-properties.enum';
import { availableLayerStyles, defaultLayerStyle } from '../../shared/map-configuration/map-layer-styles';
import { interactionStyles } from '../../shared/map-configuration/styles/system-styles.map-layer-style';
import { mapAssetAccessToAccessType } from '../../utils/access-type';

export const DEFAULT_MAP_POSITION: MapPosition = {
  x: SWISS_CENTER[0],
  y: SWISS_CENTER[1],
  z: 8,
};

/**
 * Buffer radius used to create selection/hover effects around asset geometries.
 */
const BUFFER_RADIUS_IN_METERS = 100;

export class MapController {
  readonly layers: MapLayers;
  readonly sources: MapLayerSources;
  readonly assetsClick$: Observable<number[]>;
  readonly assetsHover$: Observable<number[]>;
  readonly positionChange$: Observable<MapPosition>;

  private readonly map: OlMap;

  /**
   * All known assets, mapped by their id.
   * @private
   */
  private readonly assetsById = new Map<AssetId, AssetSearchResultItem>();

  /**
   * The IDs of all available geometries, mapped to the id of the asset that they belong to.
   * @private
   */
  private readonly assetIdsByGeometryIds = new Map<string, AssetId>();

  /**
   * The currently selected asset.
   * @private
   */
  private activeAsset: AssetSearchResultItem | null = null;

  /**
   * Whether clicking things on the map is currently allowed.
   * @private
   */
  private isClickEnabled = true;

  private showHeatmap = true;

  private isInitialized = false;

  private geoJsonHandler = new GeoJSON({
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  });
  private readonly requestedPosition$ = new ReplaySubject<Partial<MapPosition>>(1);

  constructor(element: HTMLElement, initialPosition: MapPosition) {
    const view = new View({
      projection: 'EPSG:3857',
      zoom: initialPosition.z,
      center: [initialPosition.x, initialPosition.y],
      extent: SWISS_EXTENT,
      maxZoom: 20,
      minZoom: DEFAULT_MAP_POSITION.z,
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
        this.layers.assetLocations,
        this.layers.assetGeometries,
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
      this.requestedPosition$.subscribe(this.setPositionImmediately.bind(this));
    });
  }

  setShowHeatmap(showHeatmap: boolean): void {
    this.showHeatmap = showHeatmap;
    this.layers.heatmap.setVisible(showHeatmap);
    this.layers.assetLocations.setVisible(showHeatmap);
  }

  setClickEnabled(isEnabled: boolean): void {
    this.isClickEnabled = isEnabled;
  }

  addControl(control: Control): void {
    this.map.addControl(control);
  }

  setGeometries(geometries: Geometry[]): void {
    this.assetIdsByGeometryIds.clear();

    const locationFeatures: Feature<Point>[] = Array(geometries.length);
    const heatmapFeatures: Feature<Point>[] = Array(geometries.length);
    for (let i = 0; i < geometries.length; i++) {
      const geometry = geometries[i];
      const location = new Point(olCoordsFromCoordinate(geometry.center));
      this.assetIdsByGeometryIds.set(geometry.id, geometry.assetId);
      const heatmapFeature = new Feature<Point>(location);
      heatmapFeature.setId(geometry.id);
      heatmapFeatures[i] = heatmapFeature;

      const parseGeometry = (id: GeometryId) => {
        if (id.startsWith('t')) {
          return GeometryType.LineString;
        }
        if (id.startsWith('a')) {
          return GeometryType.Polygon;
        }
        if (id.startsWith('l')) {
          return GeometryType.Point;
        }
        throw new Error('Unknown Geometrytype' + id);
      };

      const locationFeature = new Feature<Point>(location);
      locationFeature.setId(geometry.id);
      locationFeature.setProperties({ [CustomFeatureProperties.SwisstopoType]: 'GeometryLocation' });
      locationFeature.setProperties({
        [CustomFeatureProperties.GeometryType]: parseGeometry(geometry.id),
      });
      locationFeature.setProperties({ [CustomFeatureProperties.AccessType]: geometry.accessType });
      locationFeatures[i] = locationFeature;
    }

    window.requestAnimationFrame(() => {
      this.sources.heatmap.clear();
      this.sources.heatmap.addFeatures(heatmapFeatures);

      this.sources.assetLocations.clear();
      this.sources.assetLocations.addFeatures(locationFeatures);
    });
  }

  setAssets(assets: AssetSearchResultItem[]): void {
    this.assetsById.clear();
    if (this.showHeatmap) {
      window.requestAnimationFrame(() => {
        this.sources.assetGeometries.clear();
      });
      return;
    }

    const features: Feature[] = [];
    const geometries: GeometryDetail[] = [];
    for (const asset of assets) {
      this.assetsById.set(asset.id, asset);
      for (const geometry of asset.geometries) {
        const feature = makeGeometryFeature(geometry);
        feature.setProperties({
          [CustomFeatureProperties.GeometryType]: this.mapGeometryToGeometryType(feature.getGeometry()),
          [CustomFeatureProperties.AccessType]: mapAssetAccessToAccessType(asset),
        });
        features.push(feature);
        const locationFeature = this.sources.assetLocations.getFeatureById(geometry.id);
        if (locationFeature != null) {
          this.hideFeature(locationFeature);
        }
        geometries.push(geometry);
      }
    }
    window.requestAnimationFrame(() => {
      this.sources.assetGeometries.clear();
      this.sources.assetGeometries.addFeatures(features);
      this.sources.picker.clear();
      if (this.isInitialized) {
        zoomToGeometries(this.map, geometries);
      }
    });
  }

  clearAssets(): void {
    this.assetsById.clear();
    window.requestAnimationFrame(() => {
      this.sources.assetGeometries.clear();
      this.sources.polygon.clear();
      this.sources.picker.clear();
      this.sources.assetLocations.forEachFeature((feature) => {
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
    const features = asset.geometries.flatMap((geometry) => {
      const feature = makeGeometryFeature(geometry);
      return this.bufferFeatureWithStyle(feature, interactionStyles.hoveredPolygon);
    });

    this.sources.picker.clear();
    this.sources.picker.addFeatures(features);
  }

  clearHighlightedAsset(): void {
    this.sources.picker.clear();
  }

  setActiveAsset(asset: AssetSearchResultItem): void {
    this.resetActiveAssetStyle();
    this.activeAsset = asset;

    this.sources.activeAsset.clear();
    this.layers.assetGeometries.setOpacity(0.5);
    this.layers.assetLocations.setOpacity(0.5);

    const geometries: GeometryDetail[] = [];
    const features: Feature[] = [];
    for (const geometry of asset.geometries) {
      geometries.push(geometry);

      let existingFeature = this.sources.assetGeometries.getFeatureById(geometry.id);
      if (!existingFeature) {
        existingFeature = makeGeometryFeature(geometry);
        existingFeature.setProperties({
          [CustomFeatureProperties.GeometryType]: this.mapGeometryToGeometryType(existingFeature.getGeometry()),
          [CustomFeatureProperties.AccessType]: mapAssetAccessToAccessType(asset),
        });
      }
      features.push(existingFeature);

      const bufferedFeature = this.bufferFeatureWithStyle(existingFeature, interactionStyles.selectedPolygon);
      features.push(bufferedFeature);

      const locationFeature = this.sources.assetLocations.getFeatureById(geometry.id);
      if (locationFeature != null) {
        this.hideFeature(locationFeature);
      }
    }

    window.requestAnimationFrame(() => {
      this.sources.activeAsset.addFeatures(features);
      zoomToGeometries(this.map, geometries);
    });
  }

  clearActiveAsset(): void {
    if (this.activeAsset === null) {
      return;
    }
    this.resetActiveAssetStyle();
    this.activeAsset = null;
    this.sources.activeAsset.clear();
    this.layers.assetGeometries.setOpacity(1);
    this.layers.assetLocations.setOpacity(1);
  }

  getPosition(): MapPosition | null {
    const center = this.map.getView().getCenter();
    const zoom = this.map.getView().getZoom();
    if (center === undefined || zoom === undefined) {
      return null;
    }
    return { x: center[0], y: center[1], z: zoom };
  }

  setPosition(position: Partial<MapPosition>): void {
    this.requestedPosition$.next(position);
  }

  dispose(): void {
    this.map.dispose();
  }

  handleStyleChange(styleFunction: StyleFunction) {
    this.layers.assetLocations.setStyle(styleFunction);
    this.layers.assetLocations.changed();
    this.layers.assetGeometries.setStyle(styleFunction);
    this.layers.assetGeometries.changed();
    this.layers.activeAsset.setStyle(styleFunction);
    this.layers.activeAsset.changed();
  }

  private setPositionImmediately(position: Partial<MapPosition>): void {
    const oldPosition = this.getPosition();
    if (oldPosition === null) {
      throw new Error("can't set position, view is not yet initialized.");
    }
    const newPosition = extend(oldPosition, position);
    const hasChanged =
      newPosition.x !== oldPosition.x || newPosition.y !== oldPosition.y || newPosition.z !== oldPosition.z;
    if (!hasChanged) {
      return;
    }
    const view = this.map.getView();
    view.setCenter([newPosition.x, newPosition.y]);
    view.setZoom(newPosition.z);
    this.map.render();
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
      assetLocations: makeSimpleLayer<Point>({
        minZoom: 12.5,
        style: availableLayerStyles[defaultLayerStyle].styleFunction,
      }),
      polygon: makeSimpleLayer(),
      assetGeometries: makeSimpleLayer({ style: availableLayerStyles[defaultLayerStyle].styleFunction }),
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
      maxZoom: 12.5,
      blur: 20,
      radius: 5,
      opacity: 0.7,
    }) as MapLayer<Point>;
  }

  private makePositionChange$(): Observable<MapPosition> {
    return fromEventPattern((h) => this.map.getView().on('change:center', h)).pipe(
      map(() => this.getPosition()),
      filter((it) => it !== null),
    );
  }

  /**
   * Creates an observable that emits the ids of assets whose geometries have been clicked.
   *
   * - If an asset location has been clicked, that asset's id is emitted as the only clicked element.
   * - Otherwise, the ids of all overlapping assets hit by the click are emitted.
   *
   * @private
   */
  private makeAssetsClick$(): Observable<number[]> {
    return fromEventPattern<MapBrowserEvent<PointerEvent>>(
      (h) => this.map.on('click', h),
      (h) => this.map.un('click', h),
    ).pipe(
      filter(() => this.isClickEnabled),

      // Check if the click has hit an asset location, and use only that point if so.
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
            const currentAssetId = this.assetIdsByGeometryIds.get(featureId as GeometryId);
            if (currentAssetId != null) {
              assetId = currentAssetId;
            }
          },
          {
            layerFilter: (layer) => layer === this.layers.assetLocations,
          },
        );
        return [event, assetId] as const;
      }),

      map(([event, assetIdFromGeometry]) => {
        // Use the location's asset if one has been clicked.
        if (assetIdFromGeometry != null) {
          return [assetIdFromGeometry];
        }

        // Otherwise, extract the ids of all overlapping asset geometries that have been clicked.
        const assetIds = new Set<number>();
        this.map.forEachFeatureAtPixel(
          event.pixel,
          (feature): void => {
            const featureId = feature.getId();
            if (featureId == null) {
              return;
            }
            const assetId = this.assetIdsByGeometryIds.get(featureId as GeometryId);
            if (assetId != null) {
              assetIds.add(assetId);
            }
          },
          {
            layerFilter: (layer) => layer === this.layers.assetGeometries,
          },
        );
        return [...assetIds];
      }),
    );
  }

  private makeAssetsHover$(): Observable<number[]> {
    return fromEventPattern<MapBrowserEvent<PointerEvent>>(
      (h) => this.map.on('pointermove', h),
      (h) => this.map.un('pointermove', h),
    ).pipe(
      switchMap((event) => this.layers.assetGeometries.getFeatures(event.pixel)),

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

          const assetId = this.assetIdsByGeometryIds.get(featureId as GeometryId);
          if (assetId != null) {
            assetIds.push(assetId);
          }
        }
        return assetIds;
      }),
    );
  }

  private resetActiveAssetStyle(): void {
    // If we have no active asset, or if the active asset is also contained in the currently visible assets,
    // then we either can't or don't need to show the asset's locations.
    if (this.activeAsset == null || this.assetsById.has(this.activeAsset.id)) {
      return;
    }
    for (const geometry of this.activeAsset.geometries) {
      const feature = this.sources.assetLocations.getFeatureById(geometry.id);
      if (feature != null) {
        this.unhideFeature(feature);
      }
    }
  }

  private hideFeature(feature: Feature): void {
    feature.set('previousStyle', feature.getStyle() ?? availableLayerStyles[defaultLayerStyle].styleFunction);
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

  private mapGeometryToGeometryType(geometry: OlGeometry | undefined) {
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
   * A heatmap of geometries.
   */
  heatmap: MapLayer<Point>;

  /**
   * A layer displaying a single point for each asset geometry.
   * Only shown when zooming in close enough.
   */
  assetLocations: MapLayer<Point>;

  /**
   * A layer displaying the geometries of all visible assets.
   */
  assetGeometries: MapLayer;

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

type MapLayer<G extends OlGeometry = OlGeometry> = VectorLayer<VectorSource<G>>;

type LayerOptions = ConstructorParameters<typeof VectorLayer>[0];

const makeSimpleLayer = <G extends OlGeometry = OlGeometry>(options: LayerOptions = {}): MapLayer<G> =>
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
  assetLocations: requireSource(layers.assetLocations),
  polygon: requireSource(layers.polygon),
  assetGeometries: requireSource(layers.assetGeometries),
  activeAsset: requireSource(layers.activeAsset),
  picker: requireSource(layers.picker),
});

const makeGeometryFeature = (detail: GeometryDetail): Feature => {
  const geometry = ((): OlGeometry => {
    switch (detail.type) {
      case GeometryType.Point:
        return new Point(olCoordsFromCoordinate(detail.coordinates[0]));
      case GeometryType.LineString:
        return new LineString(detail.coordinates.map(olCoordsFromCoordinate));
      case GeometryType.Polygon: {
        return new Polygon([detail.coordinates.map(olCoordsFromCoordinate)]);
      }
    }
  })();
  const feature = new Feature({ geometry });
  feature.setId(detail.id);
  return feature;
};

const zoomToGeometries = (map: OlMap, geometries: GeometryDetail[]): void => {
  if (geometries.length === 0) {
    return;
  }

  const view = map.getView();
  const size = map.getSize();
  const oldCenter = view.getCenter();
  const oldZoom = view.getZoom();

  if (size == null) {
    return;
  }

  if (geometries.length === 1 && geometries[0].type === GeometryType.Point) {
    const coord = olCoordsFromCoordinate(geometries[0].coordinates[0]);
    view.setZoom(18);
    view.centerOn(coord, size, [size[0] * 0.5, size[1] / 2]);
  } else {
    const extent = {
      min: { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
      max: { x: Number.MIN_VALUE, y: Number.MIN_VALUE },
    };

    for (const geometry of geometries) {
      for (const coordinate of geometry.coordinates) {
        const [x, y] = olCoordsFromCoordinate(coordinate);
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
      zoom: DEFAULT_MAP_POSITION.z,
      center: [DEFAULT_MAP_POSITION.x, DEFAULT_MAP_POSITION.y],
      duration: 250,
      easing: easeOut,
    });
  } else {
    view.setZoom(DEFAULT_MAP_POSITION.z);
    view.setCenter([DEFAULT_MAP_POSITION.x, DEFAULT_MAP_POSITION.y]);
  }
};
