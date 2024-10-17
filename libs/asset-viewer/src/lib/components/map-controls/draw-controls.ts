import { olCoordsFromLV95, toLonLat, WGStoLV95 } from '@asset-sg/client-shared';
import { isNotNull, isNull } from '@asset-sg/core';
import { Polygon } from '@asset-sg/shared';
import { Store } from '@ngrx/store';
import { Control } from 'ol/control';
import Feature from 'ol/Feature';
import { Polygon as OlPolygon } from 'ol/geom';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import VectorSource from 'ol/source/Vector';
import { asapScheduler, BehaviorSubject, filter, fromEventPattern, map, Observable, Subscription } from 'rxjs';
import * as mapControlActions from '../../state/map-control/map-control.actions';
import { AppStateWithMapControl } from '../../state/map-control/map-control.reducer';
import { selectMapControlIsDrawing } from '../../state/map-control/map-control.selector';

export class DrawControl extends Control {
  private readonly polygonSource: VectorSource;
  private readonly draw: Draw;
  private readonly store: Store<AppStateWithMapControl>;

  private readonly subscription = new Subscription();

  private readonly _polygon$ = new BehaviorSubject<Polygon | null>(null);
  private readonly _isDrawing$: Observable<boolean>;

  constructor({ polygonSource, store, ...options }: Options) {
    super(options);

    this.polygonSource = polygonSource;
    this.store = store;
    this._isDrawing$ = this.store.select(selectMapControlIsDrawing);
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
      const geometry = new OlPolygon([polygon.map(olCoordsFromLV95)]);
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
          const flatCoords = (e.feature.getGeometry() as OlPolygon).getFlatCoordinates();
          const polygon: Polygon = [];
          for (let i = 0; i < flatCoords.length; i += 2) {
            const coords = WGStoLV95(toLonLat([flatCoords[i], flatCoords[i + 1]]));
            polygon.push(coords);
          }
          return polygon;
        })
      )
      .subscribe((polygon) =>
        asapScheduler.schedule(() => {
          this.setPolygon(polygon);
        })
      );
  }

  toggle(): void {
    this.store.dispatch(mapControlActions.toggleDraw());
  }

  get polygon$(): Observable<Polygon | null> {
    return this._polygon$.asObservable();
  }

  get isDrawing$(): Observable<boolean> {
    return this._isDrawing$;
  }

  setPolygon(polygon: Polygon | null) {
    this.store.dispatch(mapControlActions.cancelDraw());
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
  store: Store<AppStateWithMapControl>;
}
