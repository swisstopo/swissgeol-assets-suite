import { olCoordsFromLV95, toLonLat, WGStoLV95 } from '@asset-sg/client-shared';
import { isNotNull, isNull } from '@asset-sg/core';
import { LV95 } from '@asset-sg/shared';
import { Control } from 'ol/control';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import Map from 'ol/Map';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import { BehaviorSubject, distinctUntilChanged, filter, fromEventPattern, map, Observable, Subscription } from 'rxjs';

export class DrawControl extends Control {
  private readonly polygonSource: VectorSource;
  private readonly draw: Draw;

  private readonly subscription = new Subscription();

  private readonly _polygon$ = new BehaviorSubject<LV95[] | null>(null);
  private readonly _isDrawing$ = new BehaviorSubject<boolean>(false);

  constructor({ polygonSource, ...options }: Options) {
    super(options);

    this.polygonSource = polygonSource;
    this.draw = new Draw({ source: this.polygonSource, type: 'Polygon' });

    // Toggle the draw interaction based on whether the control is active.
    this.isDrawing$.subscribe((isDrawing) => {
      const map = this.getMap();
      if (map == null) {
        return;
      }
      if (isDrawing) {
        map.addInteraction(this.draw);
      } else {
        map.removeInteraction(this.draw);
      }
    });

    // Clear the previous polygon when a new one is started.
    fromEventPattern<DrawEvent>((h) => this.draw.on('drawstart', h)).subscribe(() => {
      this.polygonSource.clear();
    });

    // Remove the polygon feature when the polygon is cleared.
    this._polygon$.pipe(filter(isNull)).subscribe(() => {
      this.polygonSource.clear();
    });

    // Add or update the polygon feature when the polygon changes.
    this._polygon$.pipe(filter(isNotNull)).subscribe((polygon) => {
      const geometry = new Polygon([polygon.map(olCoordsFromLV95)]);
      const features = this.polygonSource.getFeatures();
      if (features.length > 1) {
        throw new Error('expected exactly one feature on the polygon layer');
      }
      if (features.length === 0) {
        this.polygonSource.addFeature(new Feature({ geometry }));
        return;
      }
      features[0].setGeometry(geometry);
    });

    // Replace the control's polygon when a full polygon is drawn on the map.
    fromEventPattern<DrawEvent>((h) => this.draw.on('drawend', h))
      .pipe(
        map((e) => {
          const flatCoords = (e.feature.getGeometry() as Polygon).getFlatCoordinates();
          const polygon: LV95[] = [];
          for (let i = 0; i < flatCoords.length; i += 2) {
            const coords = WGStoLV95(toLonLat([flatCoords[i], flatCoords[i + 1]]));
            polygon.push(coords);
          }
          return polygon;
        })
      )
      .subscribe(this.setPolygon.bind(this));
  }

  toggle(): void {
    this._isDrawing$.next(!this._isDrawing$.value);
  }

  get polygon$(): Observable<LV95[] | null> {
    return this._polygon$.asObservable();
  }

  get isDrawing$(): Observable<boolean> {
    return this._isDrawing$.asObservable();
  }

  setPolygon(polygon: LV95[] | null) {
    this._isDrawing$.next(false);
    this._polygon$.next(polygon);
  }

  override dispose(): void {
    super.dispose();
    this.subscription.unsubscribe();
  }
}

type ControlOptions = ConstructorParameters<typeof Control>[0];

interface Options extends ControlOptions {
  polygonSource: VectorSource;
}
