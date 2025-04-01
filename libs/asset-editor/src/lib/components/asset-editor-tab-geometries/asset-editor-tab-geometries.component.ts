import { FocusOrigin } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import {
  createFeaturesFromStudies,
  createFeaturesFromStudy,
  decorateFeature,
  editorStyles,
  isoWGSLat,
  isoWGSLng,
  LifecycleHooks,
  lv95ToWGS,
  olCoordsFromLV95Array,
  olZoomControls,
  toLonLat,
  WGStoLV95,
  WindowService,
  ZoomControlsComponent,
  zoomToStudies,
} from '@asset-sg/client-shared';
import { OO, sequenceProps } from '@asset-sg/core';
import {
  eqStudies,
  eqStudyByStudyId,
  Geom,
  GeomWithCoords,
  getStudyWithGeomWithCoords,
  LV95,
  lv95RoundedToMillimeter,
  lv95WithoutPrefix,
  LV95X,
  LV95Y,
  Point as GeomPoint,
  Studies,
  Study,
  StudyPolygon as GeomPolygon,
} from '@asset-sg/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RxState } from '@rx-angular/state';
import { point } from '@turf/helpers';
import midpoint from '@turf/midpoint';
import { sequenceS } from 'fp-ts/Apply';
import * as A from 'fp-ts/Array';
import { contramap } from 'fp-ts/Eq';
import { constFalse, constTrue, flow, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import { Eq as eqNumber } from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import { Coordinate } from 'ol/coordinate';
import { easeOut } from 'ol/easing';
import Feature from 'ol/Feature';
import { Geometry, LineString, Point, Polygon } from 'ol/geom';
import { defaults, Select, Translate } from 'ol/interaction';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import { SelectEvent } from 'ol/interaction/Select';
import { TranslateEvent } from 'ol/interaction/Translate';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { Vector as VectorSource, XYZ } from 'ol/source';
import Style from 'ol/style/Style';
import View from 'ol/View';
import {
  asyncScheduler,
  combineLatest,
  delay,
  distinctUntilChanged,
  EMPTY,
  expand,
  filter,
  fromEvent,
  fromEventPattern,
  map,
  merge,
  Observable,
  share,
  subscribeOn,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs';

import {
  AssetEditorFormGroup,
  AssetEditorGeometriesFormGroup,
  isAssetEditorFormDisabled$,
} from '../asset-editor-form-group';

type Mode = 'edit-geometry' | 'choose-new-geometry' | 'create-new-geometry';
type NewGeometryType = 'Point' | 'Polygon' | 'Linestring';
type DragMode = 'none' | 'coord' | 'geometry';

interface TabGeometriesState {
  isMapInitialised: boolean;
  studies: Studies;
  selectedStudyId: O.Option<string>;
  selectedStudyGeometrySelected: boolean;
  dragMode: DragMode;
  currentStudyCoordIndex: O.Option<number>;
  currentStudyCoordWithMenuOpen: O.Option<number>;
  mode: Mode;
  newGeometryType: NewGeometryType | null;
}

const initialTabGeometriesState: TabGeometriesState = {
  isMapInitialised: false,
  studies: [],
  selectedStudyId: O.none,
  selectedStudyGeometrySelected: false,
  dragMode: 'none',
  currentStudyCoordIndex: O.none,
  currentStudyCoordWithMenuOpen: O.none,
  mode: 'edit-geometry',
  newGeometryType: null,
};

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-tab-geometries',
  templateUrl: './asset-editor-tab-geometries.component.html',
  styleUrls: ['./asset-editor-tab-geometries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'edit-area' },
  providers: [RxState],
  standalone: false,
})
export class AssetEditorTabGeometriesComponent implements OnInit {
  private _rootFormGroupDirective = inject(FormGroupDirective);
  private rootFormGroup = this._rootFormGroupDirective.control as AssetEditorFormGroup;

  public _form!: AssetEditorGeometriesFormGroup;

  @ViewChild('map', { static: true }) mapDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('coordList', { static: false }) coordListDiv?: ElementRef<HTMLDivElement>;
  @ViewChildren('coordinateRow') coordinateRows!: QueryList<ElementRef<HTMLDivElement>>;

  private _lc = inject(LifecycleHooks);
  private _state: RxState<TabGeometriesState> = inject(RxState<TabGeometriesState>);
  private _dcmnt = inject(DOCUMENT);
  private _windowService = inject(WindowService);
  private _viewContainerRef = inject(ViewContainerRef);

  private olMap?: Map;

  public _isMapInitialised$ = this._state.select('isMapInitialised');

  public _studies$ = this._state.select('studies');
  public _mode$ = this._state.select('mode');
  public _selectedStudyId$ = this._state.select('selectedStudyId').pipe(map(O.toUndefined));
  public _selectedStudyGeometrySelected$ = this._state.select('selectedStudyGeometrySelected');
  public _newGeometryType$ = this._state.select('newGeometryType');
  public _currentStudyCoordIndex$ = this._state.select(
    ['currentStudyCoordIndex', 'currentStudyCoordWithMenuOpen'],
    ({ currentStudyCoordIndex, currentStudyCoordWithMenuOpen }) => {
      return pipe(
        currentStudyCoordIndex,
        O.alt(() => currentStudyCoordWithMenuOpen)
      );
    }
  );

  private _selectInteraction = new Select({
    style: null,
    filter: (f) =>
      this._state.get().mode !== 'create-new-geometry' ||
      pipe(
        this._state.get().selectedStudyId,
        O.filter((studyId) => String(f.getId()).startsWith(studyId)),
        O.reduce(false, constTrue)
      ),
  });

  public isDisabled$ = isAssetEditorFormDisabled$(this.rootFormGroup);

  public __selectedStudy$ = combineLatest([this._studies$, this._state.select('selectedStudyId')]).pipe(
    map(([studies, selectedStudyId]) =>
      pipe(
        selectedStudyId,
        O.chain((i) =>
          pipe(
            studies,
            A.findFirst((s) => s.studyId === i)
          )
        )
      )
    )
  );
  public _selectedStudy$ = this.__selectedStudy$.pipe(map(O.toUndefined));

  private _vectorSourceAssetGeoms = new VectorSource({ wrapX: false });
  private _vectorSourceDraw = new VectorSource({ wrapX: false });

  constructor() {
    this._state.set(initialTabGeometriesState);
    this._lc.afterViewInit$
      .pipe(take(1), subscribeOn(asyncScheduler), untilDestroyed(this))
      .subscribe(() => this._ngAfterViewInit());

    this._currentStudyCoordIndex$.pipe(untilDestroyed(this)).subscribe(() => {
      this._windowService.delayRequestAnimationFrame(0, () => {
        if (this.coordListDiv) {
          const elements = this.coordListDiv.nativeElement.querySelectorAll('.coord-selected');
          if (elements.length === 1) {
            const element = elements[0];
            let parent = this._dcmnt.activeElement?.parentElement;
            let isActiveElementChild = false;
            while (parent) {
              if (!parent || parent === this._dcmnt.body) {
                isActiveElementChild = false;
                break;
              }
              if (parent === this.coordListDiv.nativeElement) {
                isActiveElementChild = true;
                break;
              }
              parent = parent.parentElement;
            }
            if (!isActiveElementChild) {
              scrollIntoViewIfNeeded(element);
            }
          }
        }
      });
    });
  }

  ngOnInit() {
    this._form = this.rootFormGroup.get('geometries') as AssetEditorGeometriesFormGroup;
    const { studies } = this._form.getRawValue();
    this._state.set({ studies });
    this._studies$.pipe(untilDestroyed(this)).subscribe((studies) => {
      if (!eqStudies.equals(studies, this._form.getRawValue().studies)) {
        this._form.patchValue({ studies });
        this._form.markAsDirty();
      }
    });
  }

  _ngAfterViewInit(): void {
    const raster = new TileLayer({
      source: new XYZ({
        url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg`,
      }),
    });

    const origin = { center: [900000, 5900000], zoom: 9 };
    const view = new View({ projection: 'EPSG:3857', ...origin, minZoom: 7 });

    const vectorLayerAssetGeoms = new VectorLayer({ source: this._vectorSourceAssetGeoms });
    const vectorLayerDraw = new VectorLayer({ source: this._vectorSourceDraw });

    const zoomControlsInstance = this.createZoomControlsComponent().instance;

    fromEventPattern<SelectEvent>(
      (h) => this._selectInteraction.on('select', h),
      (h) => this._selectInteraction.un('select', h)
    )
      .pipe(withLatestFrom(this._state.select('selectedStudyId')), delay(0), untilDestroyed(this))
      .subscribe(([e, selectedStudyId]) => {
        if (e.selected.length === 0) {
          this._state.set({
            selectedStudyGeometrySelected: false,
            currentStudyCoordIndex: O.none,
            currentStudyCoordWithMenuOpen: O.none,
          });
          return;
        }
        if (e.selected.length !== 1) return;
        const [feature] = e.selected;
        const featureId = getGeometryFeatureId(feature);
        if (O.isSome(featureId)) {
          if (O.isNone(selectedStudyId) || (O.isSome(selectedStudyId) && featureId.value !== selectedStudyId.value)) {
            this._selectInteraction.getFeatures().clear();
            this._state.set({
              selectedStudyGeometrySelected: pipe(
                selectedStudyId,
                O.chain((i) =>
                  pipe(
                    this._state.get().studies,
                    A.findFirst((s) => s.studyId === i),
                    O.map((s) =>
                      Geom.match({
                        Point: constTrue,
                        LineString: constFalse,
                        Polygon: constFalse,
                      })(s.geom)
                    )
                  )
                ),
                O.getOrElse(constFalse)
              ),
            });
          } else {
            this._state.set({ selectedStudyGeometrySelected: true });
          }
          this._state.set({ selectedStudyId: featureId, currentStudyCoordIndex: O.none });
        } else {
          this._state.set({
            currentStudyCoordIndex: getFeatureCoordIndex(feature),
            selectedStudyGeometrySelected: false,
            currentStudyCoordWithMenuOpen: O.none,
          });
        }
      });

    const translateInteraction = new Translate({
      features: this._selectInteraction.getFeatures(),
    });

    fromEventPattern<TranslateEvent>(
      (h) => translateInteraction.on('translating', h),
      (h) => translateInteraction.un('translating', h)
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        const headFeature = pipe(this._selectInteraction.getFeatures().getArray(), NEA.fromArray, O.map(NEA.head));

        const coordFeature = pipe(headFeature, O.chain(getFeatureCoordIndex));
        const geometryFeatureId = pipe(headFeature, O.chain(getGeometryFeatureId));
        if (O.isSome(coordFeature)) {
          const coordAndIndex = pipe(
            headFeature,
            O.chain((feature) =>
              pipe(
                feature.getGeometry(),
                O.fromPredicate((g): g is Point => g instanceof Point),
                O.map((p) => coordinateToLv95RoundedWithoutPrefix(p.getCoordinates())),
                O.bindTo('coord'),
                O.bind('currentStudyCoordIndex', () => coordFeature)
              )
            )
          );
          if (O.isSome(coordAndIndex)) {
            const { coord, currentStudyCoordIndex } = coordAndIndex.value;
            this._state.set(
              flow(
                updateCurrentStudyCoordIndex(O.some(currentStudyCoordIndex)),
                updateIsMapDragMode('coord'),
                updateCoordX(coord.x),
                updateCoordY(coord.y)
              )
            );
          }
        }
        if (O.isSome(geometryFeatureId)) {
          const coords = pipe(
            headFeature,
            O.chain((feature) =>
              pipe(
                feature.getGeometry(),
                O.fromNullable,
                O.map((g) => {
                  if (g instanceof LineString) return g.getCoordinates();
                  if (g instanceof Polygon) return g.getCoordinates()[0];
                  if (g instanceof Point) return [g.getCoordinates()];
                  return null;
                }),
                O.chain(O.fromNullable),
                O.chain(NEA.fromArray),
                O.map(A.map(coordinateToLv95RoundedToMillimeter))
              )
            )
          );
          if (O.isSome(coords)) {
            this._state.set(flow(updateIsMapDragMode('geometry'), updateStudyAllCoords(coords.value)));
          }
        }
      });

    fromEventPattern<TranslateEvent>(
      (h) => translateInteraction.on('translateend', h),
      (h) => translateInteraction.un('translateend', h)
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this._state.set(updateIsMapDragMode('none'));
      });

    const olMap = new Map({
      target: this.mapDiv.nativeElement,
      controls: olZoomControls(this._dcmnt, zoomControlsInstance),
      layers: [raster, vectorLayerAssetGeoms, vectorLayerDraw],
      interactions: defaults().extend([this._selectInteraction, translateInteraction]),
      view: view,
    });
    this.olMap = olMap;

    fromEventPattern(
      (h) => olMap.once('loadend', h),
      (h) => olMap.un('loadend', h)
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.fitToSwitzerland(view, false);
        const zoom = view.getZoom();
        if (zoom != null) {
          view.setMinZoom(zoom);
          this._state.set({ isMapInitialised: true });

          this._vectorSourceAssetGeoms.clear();
          const { studies } = this._form.getRawValue();
          const studiesWithFeature = createFeaturesFromStudies(studies, {
            point: editorStyles.bigPointAsset,
            polygon: editorStyles.polygonAsset,
            lineString: editorStyles.lineStringAsset,
          });
          this._vectorSourceAssetGeoms.addFeatures(studiesWithFeature.map((s) => s.olGeometry));
          zoomToStudies(this._windowService, olMap, studies, 1);
          setTimeout(() => {
            this._state.set({
              selectedStudyId: pipe(
                studies,
                NEA.fromArray,
                O.chain(
                  flow(
                    O.fromPredicate((aa) => aa.length === 1),
                    O.map(NEA.head),
                    O.map((a) => a.studyId)
                  )
                )
              ),
            });
          });
        }
      });

    const selectedStudy$ = this._state
      .select(['selectedStudyId', 'studies'], (a) =>
        pipe(
          sequenceProps(a, 'selectedStudyId'),
          O.bind('selectedStudy', (a) =>
            pipe(
              a.studies,
              A.findFirst((s) => s.studyId === a.selectedStudyId)
            )
          )
        )
      )
      .pipe(share());

    selectedStudy$.pipe(distinctUntilChanged(), filter(O.isNone), untilDestroyed(this)).subscribe(() => {
      if (this._state.get().isMapInitialised && this._state.get().mode !== 'choose-new-geometry') {
        zoomToStudies(this._windowService, olMap, this._state.get().studies, 1);
      }
    });

    selectedStudy$
      .pipe(
        OO.fromFilteredSome,
        distinctUntilChanged(
          contramap((a: { studies: Studies; selectedStudy: Study }) => a.selectedStudy)(eqStudyByStudyId).equals
        ),
        untilDestroyed(this)
      )
      .subscribe(({ selectedStudy, studies }) => {
        this._vectorSourceAssetGeoms.getFeatures().forEach((feature) => {
          const study = studies.find((s) => s.studyId === feature.getId());
          if (study) {
            const selected = study.studyId === selectedStudy.studyId;
            setFeatureStyle(feature, study, selected);
            setCoordinateMarkers(this._vectorSourceAssetGeoms, study, selected);
            if (selected && this._state.get().isMapInitialised) {
              zoomToStudies(this._windowService, olMap, [selectedStudy], 1);
            }
          }
        });
      });

    selectedStudy$.pipe(OO.fromFilteredSome, untilDestroyed(this)).subscribe(({ selectedStudy }) => {
      this.updateMarkersForStudy(selectedStudy);
    });

    this._state
      .select(
        [
          'selectedStudyId',
          'studies',
          'currentStudyCoordIndex',
          'currentStudyCoordWithMenuOpen',
          'selectedStudyGeometrySelected',
        ],
        (a) =>
          pipe(
            sequenceProps(a, 'selectedStudyId'),
            O.bind('selectedStudy', () => getCurrentStudy(a))
          )
      )
      .pipe(OO.fromFilteredSome, untilDestroyed(this))
      .subscribe(
        ({ selectedStudy, currentStudyCoordIndex, currentStudyCoordWithMenuOpen, selectedStudyGeometrySelected }) => {
          const _currentStudyCoordIndex = pipe(
            currentStudyCoordIndex,
            O.alt(() => currentStudyCoordWithMenuOpen)
          );
          this._vectorSourceAssetGeoms.getFeatures().forEach((f) => {
            const id = getFeatureId(f);
            if (O.isSome(id)) {
              if (id.value.startsWith(makeCoordFeatureIdStartWith(selectedStudy))) {
                if (O.isSome(_currentStudyCoordIndex)) {
                  if (f.getId() === makeCoordFeatureId(selectedStudy, _currentStudyCoordIndex.value)) {
                    const isInOlSelect = this._selectInteraction
                      .getFeatures()
                      .getArray()
                      .map((f) => f.getId())
                      .includes(f.getId());
                    if (!isInOlSelect) {
                      while (this._selectInteraction.getFeatures().getLength() > 0) {
                        this._selectInteraction.getFeatures().removeAt(0);
                      }
                      this._selectInteraction.getFeatures().push(f);
                    }
                    f.setStyle(editorStyles.bigPointAssetHighlighted);
                  } else {
                    f.setStyle(editorStyles.bigPointAssetNotSelected);
                  }
                } else {
                  f.setStyle(
                    this._state.get().selectedStudyGeometrySelected
                      ? editorStyles.bigPointAssetHighlighted
                      : editorStyles.bigPointAsset
                  );
                }
              }
              if (id.value === selectedStudy.studyId) {
                f.setStyle(
                  geomStyle(
                    selectedStudy.geom,
                    selectedStudyGeometrySelected ? editorStyles.bigPointAssetHighlighted : editorStyles.bigPointAsset,
                    selectedStudyGeometrySelected ? editorStyles.polygonAssetHighlighted : editorStyles.polygonAsset,
                    selectedStudyGeometrySelected
                      ? editorStyles.lineStringAssetHighlighted
                      : editorStyles.lineStringAsset
                  )
                );
              }
            }
          });
        }
      );

    this.__selectedStudy$
      .pipe(withLatestFrom(this._state.select('selectedStudyGeometrySelected')))
      .pipe(
        map(([selectedStudy, selectedStudyGeometrySelected]) =>
          pipe(
            selectedStudy,
            O.map((selectedStudy) => ({ selectedStudy, selectedStudyGeometrySelected }))
          )
        ),
        OO.fromFilteredSome,
        untilDestroyed(this)
      )
      .subscribe((a) => {
        if (a.selectedStudyGeometrySelected) {
          this._vectorSourceAssetGeoms.getFeatures().forEach((f) => {
            const id = getFeatureId(f);
            if (O.isSome(id)) {
              if (id.value.startsWith(makeCoordFeatureIdStartWithId(a.selectedStudy.studyId))) {
                f.setStyle(editorStyles.bigPointAssetHighlighted);
              }
              if (id.value === a.selectedStudy.studyId) {
                f.setStyle(
                  geomStyle(
                    a.selectedStudy.geom,
                    editorStyles.bigPointAssetHighlighted,
                    editorStyles.polygonAssetHighlighted,
                    editorStyles.lineStringAssetNotSelected
                  )
                );
              }
            }
          });
        }
      });
  }

  drawNewGeometry() {
    this._state.set(
      flow(updateMode('choose-new-geometry'), updateSelectedStudyId(O.none), updateCurrentStudyCoordIndex(O.none))
    );
  }

  selectNewGeometryType(e: MatSelectChange) {
    const olMap = this.olMap;
    if (olMap) {
      if (e.value === 'Point') {
        const study = createNewPointStudy(olMap);
        if (O.isSome(study)) {
          const newStudies = [...this._state.get().studies, study.value];
          const studiesWithFeature = createFeaturesFromStudies([study.value], {
            point: editorStyles.bigPointAsset,
            polygon: editorStyles.polygonAsset,
            lineString: editorStyles.lineStringAsset,
          });
          this._vectorSourceAssetGeoms.addFeatures(studiesWithFeature.map((s) => s.olGeometry));
          this._state.set(
            flow(updateNewGeometryType('Point'), updateMode('create-new-geometry'), (s) => ({
              ...s,
              studies: newStudies,
              selectedStudyId: O.some(study.value.studyId),
              selectedStudyGeometrySelected: true,
            }))
          );
          this._selectInteraction.getFeatures().clear();
          this._selectInteraction.getFeatures().push(studiesWithFeature.map((s) => s.olGeometry)[0]);
        }
      }
      if (e.value === 'Polygon') {
        const study = { studyId: 'study_area_new_' + makeId(), geom: Geom.as.Polygon({ coords: [] }) };
        const newStudies = [...this._state.get().studies, study];
        this._state.set(
          flow(updateNewGeometryType('Polygon'), updateMode('create-new-geometry'), (s) => ({
            ...s,
            studies: newStudies,
            selectedStudyId: O.some(study.studyId),
            selectedStudyGeometrySelected: false,
          }))
        );

        const finishCreate$ = this._state.select('mode').pipe(
          filter((m) => m !== 'create-new-geometry'),
          take(1)
        );

        finishCreate$.pipe(untilDestroyed(this)).subscribe(() => {
          this._vectorSourceDraw.clear();
        });

        this.insertNewCoord(0, 'Polygon', finishCreate$)
          .pipe(
            expand((n) => this.insertNewCoord(n + 1, 'Polygon', finishCreate$)),
            takeUntil(finishCreate$),
            untilDestroyed(this)
          )
          .subscribe();
      }
      if (e.value === 'LineString') {
        const study = { studyId: 'study_trace_new_' + makeId(), geom: Geom.as.LineString({ coords: [] }) };
        const newStudies = [...this._state.get().studies, study];
        this._state.set(
          flow(updateNewGeometryType('Linestring'), updateMode('create-new-geometry'), (s) => ({
            ...s,
            studies: newStudies,
            selectedStudyId: O.some(study.studyId),
            selectedStudyGeometrySelected: false,
          }))
        );

        const finishCreate$ = this._state.select('mode').pipe(
          filter((m) => m !== 'create-new-geometry'),
          take(1)
        );

        finishCreate$.pipe(untilDestroyed(this)).subscribe(() => {
          this._vectorSourceDraw.clear();
        });

        this.insertNewCoord(0, 'Linestring', finishCreate$)
          .pipe(
            expand((n) => this.insertNewCoord(n + 1, 'Linestring', finishCreate$)),
            takeUntil(finishCreate$),
            untilDestroyed(this)
          )
          .subscribe();
      }
    }
  }

  updateMarkersForStudy(study: Study) {
    this._vectorSourceAssetGeoms.getFeatures().forEach((feature) => {
      if (feature.getId() === study.studyId) {
        Geom.match({
          Point: (a) => {
            if (this._state.get().dragMode !== 'geometry') {
              feature.setGeometry(new Point(olCoordsFromLV95Array([a.coord])[0]));
            }
          },
          LineString: (a) => {
            if (this._state.get().dragMode !== 'geometry') {
              feature.setGeometry(new LineString(olCoordsFromLV95Array(a.coords)));
            }
            a.coords.forEach((coord, i) => {
              const marker = this._vectorSourceAssetGeoms.getFeatureById(makeCoordFeatureId(study, i));
              if (marker) {
                marker.setGeometry(new Point(olCoordsFromLV95Array([coord])[0]));
                marker.setStyle(editorStyles.bigPointAssetHighlighted);
              } else {
                makeCoordinateMarker(this._vectorSourceAssetGeoms, coord, i, study);
              }
              const markerToDelete = this._vectorSourceAssetGeoms.getFeatureById(
                makeCoordFeatureId(study, a.coords.length)
              );
              if (markerToDelete) {
                this._vectorSourceAssetGeoms.removeFeature(markerToDelete);
              }
            });
          },
          Polygon: (a) => {
            if (this._state.get().dragMode !== 'geometry') {
              feature.setGeometry(new Polygon([olCoordsFromLV95Array(a.coords)]));
            }
            if (this._state.get().dragMode !== 'coord') {
              a.coords.forEach((coord, i) => {
                if (i == a.coords.length - 1) return;
                const marker = this._vectorSourceAssetGeoms.getFeatureById(makeCoordFeatureId(study, i));
                if (marker) {
                  marker.setGeometry(new Point(olCoordsFromLV95Array([coord])[0]));
                  marker.setStyle(editorStyles.bigPointAssetHighlighted);
                } else {
                  makeCoordinateMarker(this._vectorSourceAssetGeoms, coord, i, study);
                }
              });
              const markerToDelete = this._vectorSourceAssetGeoms.getFeatureById(
                makeCoordFeatureId(study, a.coords.length - 1)
              );
              if (markerToDelete) {
                this._vectorSourceAssetGeoms.removeFeature(markerToDelete);
              }
            }
          },
        })(study.geom);
      }
    });
  }

  insertNewCoord(currentPointIndex: number, geometryType: NewGeometryType, cancelInsert$: Observable<unknown>) {
    const olMap = this.olMap;
    if (!olMap) return EMPTY;

    const draw = new Draw({
      source: this._vectorSourceDraw,
      type: 'Point',
      style: editorStyles.bigPointAssetHighlighted,
    });
    olMap.addInteraction(draw);

    const drawEnd$ = fromEventPattern<DrawEvent>(
      (h) => draw.on('drawend', h),
      (h) => draw.un('drawend', h)
    ).pipe(take(1), takeUntil(cancelInsert$), share());

    drawEnd$.pipe(untilDestroyed(this)).subscribe(() => {
      const study = pipe(getCurrentStudy(this._state.get()), O.chain(getStudyWithGeomWithCoords));
      if (O.isSome(study)) {
        const point = new Point(olCoordsFromLV95Array(study.value.geom.coords)[currentPointIndex]);
        const feature = decorateFeature(new Feature({ geometry: point }), {
          style: editorStyles.bigPointAsset,
          id: `point_${currentPointIndex}`,
        });
        this._vectorSourceDraw.addFeature(feature);
        if (currentPointIndex > 0) {
          const lineFeature = decorateFeature(
            new Feature({
              geometry: new LineString([
                olCoordsFromLV95Array(study.value.geom.coords)[currentPointIndex - 1],
                olCoordsFromLV95Array(study.value.geom.coords)[currentPointIndex],
              ]),
            }),
            {
              style: editorStyles.polygonAsset,
              id: `line_${currentPointIndex - 1}`,
            }
          );
          this._vectorSourceDraw.addFeature(lineFeature);
        }
        if (geometryType === 'Polygon' && currentPointIndex > 1) {
          const finalFeature = this._vectorSourceDraw.getFeatureById(`line_final`);
          if (finalFeature) {
            this._vectorSourceDraw.removeFeature(finalFeature);
          }
          const lineFeature = decorateFeature(
            new Feature({
              geometry: new LineString([
                olCoordsFromLV95Array(study.value.geom.coords)[currentPointIndex],
                olCoordsFromLV95Array(study.value.geom.coords)[0],
              ]),
            }),
            {
              style: editorStyles.polygonAssetNotSelected,
              id: `line_final`,
            }
          );
          this._vectorSourceDraw.addFeature(lineFeature);
        }
      }
      olMap.removeInteraction(draw);
    });

    cancelInsert$.pipe(untilDestroyed(this)).subscribe(() => {
      olMap.removeInteraction(draw);
    });

    fromEvent(this.mapDiv.nativeElement, 'mouseenter')
      .pipe(takeUntil(merge(cancelInsert$, drawEnd$)), untilDestroyed(this))
      .subscribe(() => {
        olMap.addInteraction(draw);
        const finalFeature = this._vectorSourceDraw.getFeatureById(`line_final`);
        if (finalFeature) {
          finalFeature.setStyle(editorStyles.polygonAssetNotSelected);
        }
      });

    fromEvent(this.mapDiv.nativeElement, 'mouseout')
      .pipe(takeUntil(merge(cancelInsert$, drawEnd$)), untilDestroyed(this))
      .subscribe(() => {
        const preview1LineFeature = this._vectorSourceDraw.getFeatureById(`line_preview1`);
        if (preview1LineFeature) {
          this._vectorSourceDraw.removeFeature(preview1LineFeature);
        }
        const preview2LineFeature = this._vectorSourceDraw.getFeatureById(`line_preview2`);
        if (preview2LineFeature) {
          this._vectorSourceDraw.removeFeature(preview2LineFeature);
        }
        const finalFeature = this._vectorSourceDraw.getFeatureById(`line_final`);
        if (finalFeature) {
          finalFeature.setStyle(editorStyles.polygonAsset);
        }

        olMap.removeInteraction(draw);

        const { selectedStudyId, studies, currentStudyCoordIndex } = this._state.get();
        const updateResult = pipe(
          selectedStudyId,
          O.chain((studyId) =>
            pipe(
              studies,
              A.findIndex((s) => s.studyId === studyId),
              O.bindTo('index'),
              O.bind('study', ({ index }) => pipe(studies, A.lookup(index), O.chain(getStudyWithGeomWithCoords))),
              O.bind('currentStudyCoordIndex', () => currentStudyCoordIndex),
              O.bind('updatedStudy', ({ study, currentStudyCoordIndex }) =>
                pipe(
                  study.geom.coords,
                  A.deleteAt(currentStudyCoordIndex),
                  O.map((coords) => (coords.length === 1 ? A.unsafeDeleteAt(0, coords) : coords)),
                  O.map((coords) => ({ ...study, geom: { ...study.geom, coords } }))
                )
              ),
              O.bind('updatedStudies', ({ index, updatedStudy }) =>
                pipe(studies, A.updateAt(index, updatedStudy as Study))
              )
            )
          )
        );
        if (O.isSome(updateResult)) {
          this._state.set({ studies: updateResult.value.updatedStudies, currentStudyCoordIndex: O.none });
        }
      });

    fromEventPattern<MapBrowserEvent<PointerEvent>>(
      (h) => olMap.on('pointermove', h),
      (h) => olMap.un('pointermove', h)
    )
      .pipe(takeUntil(merge(cancelInsert$, drawEnd$)), untilDestroyed(this))
      .subscribe((ev) => {
        const coord = coordinateToLv95RoundedToMillimeter(ev.coordinate);
        if (!O.getEq(eqNumber).equals(O.some(currentPointIndex), this._state.get().currentStudyCoordIndex)) {
          const { selectedStudyId, studies } = this._state.get();
          const updateResult = pipe(
            selectedStudyId,
            O.chain((studyId) =>
              pipe(
                studies,
                A.findIndex((s) => s.studyId === studyId),
                O.bindTo('index'),
                O.bind('study', ({ index }) => pipe(studies, A.lookup(index), O.chain(getStudyWithGeomWithCoords))),
                O.bind('updatedStudy', ({ study }) =>
                  pipe(
                    study.geom.coords,
                    A.insertAt(currentPointIndex, coord),
                    O.map((coords) =>
                      currentPointIndex === 0 && geometryType === 'Polygon'
                        ? A.unsafeInsertAt(currentPointIndex + 1, coord, coords)
                        : coords
                    ),
                    O.map((coords) => ({ ...study, geom: { ...study.geom, coords } }))
                  )
                ),
                O.bind('updatedStudies', ({ index, updatedStudy }) =>
                  pipe(studies, A.updateAt(index, updatedStudy as Study))
                )
              )
            )
          );
          if (O.isSome(updateResult)) {
            this._state.set((s) => ({
              currentStudyCoordIndex: O.some(currentPointIndex),
              studies: pipe(
                updateResult,
                O.map((f) => f.updatedStudies),
                O.getOrElse(() => s.studies)
              ),
            }));
            if (currentPointIndex > 0) {
              const preview1LineFeature = this._vectorSourceDraw.getFeatureById(`line_preview1`);
              if (preview1LineFeature) {
                this._vectorSourceDraw.removeFeature(preview1LineFeature);
              }
              const feature1 = decorateFeature(
                new Feature({
                  geometry: new LineString([
                    olCoordsFromLV95Array([updateResult.value.updatedStudy.geom.coords[currentPointIndex - 1]])[0],
                    ev.coordinate,
                  ]),
                }),
                { style: editorStyles.linePreview, id: `line_preview1` }
              );
              this._vectorSourceDraw.addFeature(feature1);
              if (geometryType === 'Polygon') {
                const preview2LineFeature = this._vectorSourceDraw.getFeatureById(`line_preview2`);
                if (preview2LineFeature) {
                  this._vectorSourceDraw.removeFeature(preview2LineFeature);
                }
                const feature2 = decorateFeature(
                  new Feature({
                    geometry: new LineString([
                      olCoordsFromLV95Array([updateResult.value.updatedStudy.geom.coords[0]])[0],
                      ev.coordinate,
                    ]),
                  }),
                  { style: editorStyles.linePreview, id: `line_preview2` }
                );
                this._vectorSourceDraw.addFeature(feature2);
              }
            }
          }
        } else {
          const coord = coordinateToLv95RoundedWithoutPrefix(ev.coordinate);
          this._state.set(flow(updateCoordX(coord.x), updateCoordY(coord.y)));
          const preview1LineFeature = this._vectorSourceDraw.getFeatureById(`line_preview1`);
          if (preview1LineFeature) {
            const preview1LineGeometry =
              preview1LineFeature.getGeometry()?.getType() === 'LineString'
                ? (preview1LineFeature.getGeometry() as LineString)
                : undefined;
            if (preview1LineGeometry) {
              preview1LineGeometry.setCoordinates([preview1LineGeometry.getCoordinates()[0], ev.coordinate]);
            }
          }
          if (geometryType === 'Polygon') {
            const preview2LineFeature = this._vectorSourceDraw.getFeatureById(`line_preview2`);
            if (preview2LineFeature) {
              const preview2LineGeometry =
                preview2LineFeature.getGeometry()?.getType() === 'LineString'
                  ? (preview2LineFeature.getGeometry() as LineString)
                  : undefined;
              if (preview2LineGeometry) {
                preview2LineGeometry.setCoordinates([preview2LineGeometry.getCoordinates()[0], ev.coordinate]);
              }
            }
          }
        }
      });

    return drawEnd$.pipe(map(() => currentPointIndex));
  }

  updateCoordX(ev: InputEvent) {
    this._state.set(updateCoordX((ev.target as HTMLInputElement).value));
  }

  updateCoordY(ev: InputEvent) {
    this._state.set(updateCoordY((ev.target as HTMLInputElement).value));
  }

  addNewCoord(index: number) {
    this._state.set(addNewCoord(index));
    setTimeout(() => {
      const newRow = this.coordinateRows.get(index + 1);
      if (newRow) {
        scrollIntoViewIfNeeded(newRow.nativeElement);
        newRow.nativeElement.querySelector('input')?.focus();
      }
    });
  }

  deleteCoord(index: number) {
    this._state.set(flow(updateIsMapDragMode('none'), deleteCoord(index)));
    setTimeout(() => {
      const rowToFocus = this.coordinateRows.get(index);
      if (rowToFocus) {
        scrollIntoViewIfNeeded(rowToFocus.nativeElement);
        rowToFocus.nativeElement.querySelector('input')?.focus();
      }
    });
  }

  setCurrentStudyCoordIndex(focusOrigin: FocusOrigin, index: number) {
    const study = pipe(
      this._state.get().selectedStudyId,
      O.chain((id) =>
        pipe(
          this._state.get().studies,
          A.findFirst((s) => s.studyId === id)
        )
      )
    );
    if (O.isSome(study)) {
      if (study.value.geom._tag === 'Point') {
        const selected = focusOrigin != null;
        if (selected) {
          this._state.set(
            flow(
              updateSelectedStudyGeometrySelected(true),
              updateCurrentStudyCoordIndex(O.some(0)),
              updateIsMapDragMode(focusOrigin != null ? 'none' : 'geometry')
            )
          );
          const pointFeature = this._vectorSourceAssetGeoms.getFeatureById(study.value.studyId);
          if (pointFeature) {
            this._selectInteraction.getFeatures().clear();
            this._selectInteraction.getFeatures().push(pointFeature);
            pointFeature.setStyle(editorStyles.bigPointAssetHighlighted);
          }
        }
      } else {
        this._state.set(updateCurrentStudyCoordIndex(focusOrigin != null ? O.some(index) : O.none));
      }
    }
  }

  setCurrentStudyCoordWithMenuOpen(isOpen: boolean, index: number) {
    this._state.set({ currentStudyCoordWithMenuOpen: isOpen ? O.some(index) : O.none });
  }

  selectStudy(ev: MatSelectChange) {
    this._state.set({
      selectedStudyId: O.some(ev.value),
      currentStudyCoordIndex: O.none,
      selectedStudyGeometrySelected: false,
    });
  }

  deleteSelectedGeometry() {
    this._deleteSelectedStudyGeometryFeature();
    this._state.set(flow(deleteSelectedStudy, selectStudyIfOnly1));
  }

  cancelCreateGeometry() {
    this._deleteSelectedStudyGeometryFeature();
    this._state.set(
      flow(deleteSelectedStudy, selectStudyIfOnly1, updateNewGeometryType(null), updateMode('edit-geometry'))
    );
  }

  commitCreateGeometry() {
    this._vectorSourceDraw.clear();
    const study = getCurrentStudy(this._state.get());
    if (O.isSome(study)) {
      const studyWithFeature = createFeaturesFromStudy(study.value, {
        point: editorStyles.bigPointAsset,
        polygon: editorStyles.polygonAsset,
        lineString: editorStyles.lineStringAsset,
      });
      this._vectorSourceAssetGeoms.addFeatures([studyWithFeature.olGeometry]);
      this.updateMarkersForStudy(study.value);
    }
    this._state.set(
      flow(
        updateNewGeometryType(null),
        updateMode('edit-geometry'),
        updateSelectedStudyGeometrySelected(false),
        updateCurrentStudyCoordIndex(O.none)
      )
    );
  }

  private _deleteSelectedStudyGeometryFeature() {
    const { selectedStudyId } = this._state.get();
    if (O.isSome(selectedStudyId)) {
      this._vectorSourceAssetGeoms.getFeatures().forEach((f) => {
        if (String(f.getId()).startsWith(selectedStudyId.value)) {
          this._vectorSourceAssetGeoms.removeFeature(f);
        } else {
          const study = pipe(
            this._state.get().studies,
            A.findFirst((s) => s.studyId === f.getId())
          );
          if (O.isSome(study)) {
            f.setStyle(
              geomStyle(
                study.value.geom,
                editorStyles.bigPointAsset,
                editorStyles.polygonAsset,
                editorStyles.lineStringAsset
              )
            );
          }
        }
      });
    }
  }

  trackByIndex(index: number): string {
    return index.toString();
  }

  fitToSwitzerland(view: View, withAnimation: boolean) {
    view.fit(
      new Polygon([
        [
          [662739.4642028128, 6075958.039112476],
          [658764.7387319836, 5748807.558051921],
          [1176090.5461660565, 5747278.817486218],
          [1172115.8206952275, 6079321.268357024],
          [662739.4642028128, 6075958.039112476],
        ],
      ]),
      withAnimation ? { duration: 250, easing: easeOut } : {}
    );
  }

  createZoomControlsComponent() {
    return this._viewContainerRef.createComponent(ZoomControlsComponent);
  }
}

const getCurrentStudy = (state: Pick<TabGeometriesState, 'selectedStudyId' | 'studies'>) =>
  pipe(
    state.selectedStudyId,
    O.chain((id) =>
      pipe(
        state.studies,
        A.findFirst((s) => s.studyId === id)
      )
    )
  );

const makeCoordFeatureIdStartWithId = (studyId: string) => `${studyId}-`;
const makeCoordFeatureIdStartWith = (study: Study) => makeCoordFeatureIdStartWithId(study.studyId);

const makeCoordFeatureId = (study: Study, index: number) => `${makeCoordFeatureIdStartWith(study)}${index}`;

const setCoordinateMarkers = (vectorSource: VectorSource<Geometry>, study: Study, selected: boolean) => {
  if (Geom.isAnyOf(['Polygon', 'LineString'])(study.geom)) {
    if (selected) {
      const { coords } = study.geom;
      coords.forEach((coord, index) => {
        if (index === coords.length - 1) return;
        makeCoordinateMarker(vectorSource, coord, index, study);
      });
    } else {
      study.geom.coords.forEach((_, index) => {
        const feature = vectorSource.getFeatureById(makeCoordFeatureId(study, index));
        if (feature) {
          vectorSource.removeFeature(feature);
        }
      });
    }
  }
};

const makeCoordinateMarker = (vectorSource: VectorSource<Geometry>, coord: LV95, index: number, study: Study) =>
  vectorSource.addFeature(
    decorateFeature(
      new Feature(new Point(olCoordsFromLV95Array([coord])[0])),
      {
        style: editorStyles.bigPointAsset,
        id: makeCoordFeatureId(study, index),
      },
      {
        assetSgFeatureType: 'Coord',
        assetSgFeatureCoordIndex: index,
      }
    )
  );

const setFeatureStyle = (feature: Feature, study: Study, selected: boolean) => {
  const style = Geom.matchStrict({
    Point: () => (selected ? editorStyles.bigPointAsset : editorStyles.bigPointAssetNotSelected),
    Polygon: () => (selected ? editorStyles.polygonAsset : editorStyles.polygonAssetNotSelected),
    LineString: () => (selected ? editorStyles.lineStringAsset : editorStyles.lineStringAssetNotSelected),
  })(study.geom);
  feature.setStyle(style);
};

const updateStudyCoord =
  <T>(
    value: unknown,
    validateValue: (a: unknown) => O.Option<T>,
    updatePoint: (point: GeomPoint, value: T) => GeomPoint,
    updateStudyCoords: (geom: GeomWithCoords, coordIndex: number, value: T) => O.Option<Geom>
  ) =>
  (state: TabGeometriesState) =>
    pipe(
      sequenceS(O.Applicative)({
        selectedStudyId: state.selectedStudyId,
        currentStudyCoordIndex: state.currentStudyCoordIndex,
        validatedValue: validateValue(value),
      }),
      O.chain(({ selectedStudyId, currentStudyCoordIndex, validatedValue }) =>
        pipe(
          state.studies,
          A.findIndex((study) => study.studyId === selectedStudyId),
          O.bindTo('selectedStudyIndex'),
          O.bind('studies', ({ selectedStudyIndex }) =>
            pipe(
              state.studies,
              A.modifyAt(selectedStudyIndex, (study) =>
                pipe(
                  Geom.matchStrict<O.Option<Geom>>({
                    Point: (a) => O.some(updatePoint(a, validatedValue)),
                    LineString: (a) => updateStudyCoords(a, currentStudyCoordIndex, validatedValue),
                    Polygon: (a) => {
                      const maybeGeom = updateStudyCoords(
                        a,
                        currentStudyCoordIndex,
                        validatedValue
                      ) as O.Option<GeomPolygon>;
                      return currentStudyCoordIndex !== 0 || a.coords.length === 1
                        ? maybeGeom
                        : pipe(
                            maybeGeom,
                            O.chain((g) => updateStudyCoords(g, g.coords.length - 1, validatedValue))
                          );
                    },
                  })(study.geom),
                  O.map((geom) => ({ ...study, geom })),
                  O.getOrElse(() => study)
                )
              )
            )
          ),
          O.bind('selectedStudyGeometrySelected', ({ studies, selectedStudyIndex }) =>
            pipe(
              studies,
              A.lookup(selectedStudyIndex),
              O.map((study) =>
                Geom.match({
                  Point: constTrue,
                  LineString: () => state.selectedStudyGeometrySelected,
                  Polygon: () => state.selectedStudyGeometrySelected,
                })(study.geom)
              )
            )
          )
        )
      ),
      O.map(({ studies, selectedStudyGeometrySelected }) => ({
        ...state,
        studies,
        selectedStudyGeometrySelected,
      })),
      O.getOrElse(() => state)
    );

const updateStudyAllCoords = (coords: LV95[]) => (state: TabGeometriesState) => {
  const studies = pipe(
    state.selectedStudyId,
    O.bindTo('selectedStudyId'),
    O.bind('selectedStudyIndex', ({ selectedStudyId }) =>
      pipe(
        state.studies,
        A.findIndex((study) => study.studyId === selectedStudyId)
      )
    ),
    O.bind('study', ({ selectedStudyIndex }) =>
      pipe(
        state.studies,
        A.lookup(selectedStudyIndex),
        O.map((study) => ({
          ...study,
          geom: Geom.transform({
            Point: (a) => ({ ...a, coord: coords[0] }),
            Polygon: (a) => ({ ...a, coords }),
            LineString: (a) => ({ ...a, coords }),
          })(study.geom),
        }))
      )
    ),
    O.chain(({ selectedStudyIndex, study }) => pipe(state.studies, A.updateAt(selectedStudyIndex, study))),
    O.getOrElse(() => state.studies)
  );
  return { ...state, studies };
};

const updateStudyCoords =
  <T>(updateCoord: (coord: LV95, value: T) => LV95) =>
  (geom: GeomWithCoords, studyCoordIndex: number, value: T) => {
    return pipe(
      geom.coords,
      A.modifyAt(studyCoordIndex, (coord) => updateCoord(coord, value)),
      O.map((coords) => ({ ...geom, coords }))
    );
  };

const updateCoordX =
  (value: unknown) =>
  (state: TabGeometriesState): TabGeometriesState => {
    const updateCoord = (c: LV95, x: LV95X): LV95 => ({ ...c, x });
    const updatePoint = (p: GeomPoint, x: LV95X): GeomPoint => ({ ...p, coord: updateCoord(p.coord, x) });
    return updateStudyCoord(
      value,
      (a) => O.some((Number(a) + 1000000) as LV95X),
      updatePoint,
      updateStudyCoords(updateCoord)
    )(state);
  };

const updateMode =
  (mode: Mode) =>
  (state: TabGeometriesState): TabGeometriesState => ({ ...state, mode });

const updateNewGeometryType =
  (newGeometryType: NewGeometryType | null) =>
  (state: TabGeometriesState): TabGeometriesState => ({ ...state, newGeometryType });

const updateCurrentStudyCoordIndex =
  (currentStudyCoordIndex: O.Option<number>) =>
  (state: TabGeometriesState): TabGeometriesState => ({
    ...state,
    currentStudyCoordIndex,
    selectedStudyGeometrySelected: pipe(
      currentStudyCoordIndex,
      O.fold(() => state.selectedStudyGeometrySelected, constFalse)
    ),
  });

const updateSelectedStudyId =
  (selectedStudyId: O.Option<string>) =>
  (state: TabGeometriesState): TabGeometriesState => ({ ...state, selectedStudyId });

const updateCoordY =
  (value: unknown) =>
  (state: TabGeometriesState): TabGeometriesState => {
    const updateCoord = (c: LV95, y: LV95Y): LV95 => ({ ...c, y });
    const updatePoint = (p: GeomPoint, y: LV95Y): GeomPoint => ({ ...p, coord: updateCoord(p.coord, y) });
    return updateStudyCoord(
      value,
      (a) => O.some((Number(a) + 2000000) as LV95Y),
      updatePoint,
      updateStudyCoords(updateCoord)
    )(state);
  };

const updateIsMapDragMode =
  (dragMode: DragMode) =>
  (state: TabGeometriesState): TabGeometriesState => ({ ...state, dragMode });

const updateSelectedStudyGeometrySelected =
  (selectedStudyGeometrySelected: boolean) =>
  (state: TabGeometriesState): TabGeometriesState => ({ ...state, selectedStudyGeometrySelected });

const deleteSelectedStudy = (state: TabGeometriesState): TabGeometriesState => ({
  ...state,
  selectedStudyId: O.none,
  selectedStudyGeometrySelected: false,
  currentStudyCoordIndex: O.none,
  currentStudyCoordWithMenuOpen: O.none,
  studies: pipe(
    state.selectedStudyId,
    O.map((id) => state.studies.filter((s) => s.studyId !== id)),
    O.getOrElse(() => state.studies)
  ),
});

const selectStudyIfOnly1 = (state: TabGeometriesState): TabGeometriesState =>
  state.studies.length === 1 ? { ...state, selectedStudyId: O.some(state.studies[0].studyId) } : state;

const addNewCoord =
  (index: number) =>
  (state: TabGeometriesState): TabGeometriesState =>
    pipe(
      state.selectedStudyId,
      O.bindTo('selectedStudyId'),
      O.bind('selectedStudyIndex', ({ selectedStudyId }) =>
        pipe(
          state.studies,
          A.findIndex((s) => s.studyId === selectedStudyId)
        )
      ),
      O.bind('study', ({ selectedStudyIndex }) => getStudyWithGeomWithCoords(state.studies[selectedStudyIndex])),
      O.bind('newCoord', ({ study }) =>
        pipe(
          sequenceS(O.Applicative)({
            coord1: pipe(study.geom.coords, A.lookup(index), O.map(lv95ToWGS)),
            coord2: pipe(study.geom.coords, A.lookup(index + 1), O.map(lv95ToWGS)),
          }),
          O.map(({ coord1, coord2 }) =>
            midpoint(
              point([isoWGSLng.get(coord1.lng), isoWGSLat.get(coord1.lat)]),
              point([isoWGSLng.get(coord2.lng), isoWGSLat.get(coord2.lat)])
            )
          ),
          O.map((p) => WGStoLV95([p.geometry.coordinates[0], p.geometry.coordinates[1]])),
          O.map(lv95RoundedToMillimeter)
        )
      ),
      O.map(({ study, newCoord, selectedStudyIndex }) => ({
        ...state,
        currentStudyCoordIndex: O.some(index + 1),
        studies: A.unsafeUpdateAt(
          selectedStudyIndex,
          {
            ...study,
            geom: { ...study.geom, coords: A.unsafeInsertAt(index + 1, newCoord, study.geom.coords) },
          },
          state.studies
        ),
      })),
      O.getOrElse(() => state)
    );

const deleteCoord =
  (index: number) =>
  (state: TabGeometriesState): TabGeometriesState =>
    pipe(
      state.selectedStudyId,
      O.bindTo('selectedStudyId'),
      O.bind('selectedStudyIndex', ({ selectedStudyId }) =>
        pipe(
          state.studies,
          A.findIndex((s) => s.studyId === selectedStudyId)
        )
      ),
      O.chain(({ selectedStudyIndex }) =>
        pipe(
          state.studies,
          A.lookup(selectedStudyIndex),
          O.chain(getStudyWithGeomWithCoords),
          O.map((study) => ({
            ...state,
            studies: A.unsafeUpdateAt(
              selectedStudyIndex,
              {
                ...study,
                geom: {
                  ...study.geom,
                  coords: pipe(A.unsafeDeleteAt(index, study.geom.coords), (cs) =>
                    study.geom._tag === 'Polygon' && index === 0 && cs.length > 1
                      ? A.unsafeUpdateAt(cs.length - 1, { ...cs[0] }, cs)
                      : cs
                  ),
                },
              },
              state.studies
            ),
          }))
        )
      ),
      O.getOrElse(() => state)
    );

const getFeatureCoordIndex = (feature: Feature) => {
  const { assetSgFeatureType, assetSgFeatureCoordIndex } = feature.getProperties();
  return assetSgFeatureType === 'Coord' && typeof assetSgFeatureCoordIndex === 'number'
    ? O.some(assetSgFeatureCoordIndex)
    : O.none;
};

const getGeometryFeatureId = (feature: Feature) => {
  const { assetSgFeatureType } = feature.getProperties();
  return assetSgFeatureType === 'Polygon' || assetSgFeatureType === 'LineString' || assetSgFeatureType === 'Point'
    ? getFeatureId(feature)
    : O.none;
};

const getFeatureId = (feature: Feature) =>
  pipe(
    feature.getId(),
    O.fromNullable,
    O.filter((id): id is string => typeof id === 'string')
  );

const createNewPointStudy = (olMap: Map | undefined): O.Option<Study> =>
  pipe(
    olMap,
    O.fromNullable,
    O.chain((map) => O.fromNullable(map.getView().getCenter())),
    O.map(coordinateToLv95RoundedToMillimeter),
    O.map((coord) => ({ studyId: 'study_location_new_' + makeId(), geom: Geom.as.Point({ coord }) }))
  );

const coordinateToLv95RoundedToMillimeter = (c: Coordinate): LV95 =>
  pipe([c[0], c[1]] as [number, number], toLonLat, WGStoLV95, lv95RoundedToMillimeter);

const coordinateToLv95RoundedWithoutPrefix = (c: Coordinate): LV95 =>
  pipe([c[0], c[1]] as [number, number], toLonLat, WGStoLV95, lv95WithoutPrefix);

const geomStyle = (geom: Geom, pointStyle: Style, polygonStyle: Style, lineStringStyle: Style): Style =>
  Geom.matchStrict({
    Point: () => pointStyle,
    Polygon: () => polygonStyle,
    LineString: () => lineStringStyle,
  })(geom);

const scrollIntoViewIfNeeded = (element: Element) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((element as any).scrollIntoViewIfNeeded) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element as any).scrollIntoViewIfNeeded({ behavior: 'smooth' });
  } else {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

let nextId = 0;
const makeId = () => nextId++;
