import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RxState } from '@rx-angular/state';
import * as A from 'fp-ts/Array';
import { Lazy, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import Feature from 'ol/Feature';
import { Geometry, Point, Polygon } from 'ol/geom';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import { Heatmap, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { fromLonLat } from 'ol/proj';
import { Cluster, Vector as VectorSource, XYZ } from 'ol/source';
import { Icon } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import Style from 'ol/style/Style';
import View from 'ol/View';
import {
    asyncScheduler,
    delay,
    distinctUntilChanged,
    filter,
    fromEventPattern,
    identity,
    map,
    merge,
    Observable,
    share,
    shareReplay,
    subscribeOn,
    switchMap,
    take,
    withLatestFrom,
} from 'rxjs';

import {
    createFeaturesFromStudies,
    decorateFeature,
    featureStyles,
    fitToSwitzerland,
    isoWGSLat,
    isoWGSLng,
    LifecycleHooks,
    LifecycleHooksDirective,
    lv95ToWGS,
    olCoordsFromLV95Array,
    olZoomControls,
    toLonLat,
    WGStoLV95,
    WindowService,
    ZoomControlsComponent,
    zoomToStudies,
} from '@asset-sg/client-shared';
import { makePairs, OO, ORD, rdSequenceProps } from '@asset-sg/core';
import { eqLV95Array, LV95 } from '@asset-sg/shared';

import { AllStudyDTO } from '../../models';
import { AllStudyService } from '../../services/all-study.service';
import { RDCurrentAssetDetailVM, RDStudiesVM } from '../../state/asset-viewer.selectors';

interface MapState {
    rdCurrentAssetDetail: RDCurrentAssetDetailVM;
    rdStudies: RDStudiesVM;
    isMapInitialised: boolean;
    drawingMode: boolean;
    selectionMode: boolean;
    polygon: O.Option<LV95[]>;
    highlightAssetStudies: O.Option<number>;
}

const initialMapState: MapState = {
    rdCurrentAssetDetail: RD.initial,
    rdStudies: RD.initial,
    isMapInitialised: false,
    drawingMode: false,
    selectionMode: true,
    polygon: O.none,
    highlightAssetStudies: O.none,
};

@UntilDestroy()
@Component({
    selector: 'asset-sg-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    hostDirectives: [LifecycleHooksDirective],
    providers: [RxState],
})
export class MapComponent {
    @ViewChild('map', { static: true }) mapDiv!: ElementRef<HTMLDivElement>;
    @Output('polygonChanged') public polygonChanged$ = new EventEmitter<LV95[]>();

    private _lc = inject(LifecycleHooks);
    private _dcmnt = inject(DOCUMENT);
    private _viewContainerRef = inject(ViewContainerRef);
    private _allStudyService = inject(AllStudyService);
    private _windowService = inject(WindowService);
    private state: RxState<MapState> = inject(RxState<MapState>);

    public _isMapInitialised$ = this.state.select('isMapInitialised');

    @Output('mapInitialised')
    public isMapInitialised$ = this.state.$.pipe(
        map(s => s.isMapInitialised),
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    @Output('assetClicked')
    public assetClicked$ = new EventEmitter<number[]>();

    @Input()
    public set rdStudies$(value: Observable<RDStudiesVM>) {
        this.state.connect('rdStudies', value);
    }

    @Input()
    public set rdCurrentAssetDetail$(value: Observable<RDCurrentAssetDetailVM>) {
        this.state.connect('rdCurrentAssetDetail', value);
    }

    @Input()
    public set searchPolygon$(value: Observable<O.Option<LV95[]>>) {
        this.state.connect('polygon', value);
    }

    @Input() set highlightAssetStudies(value: Observable<O.Option<number>>) {
        this.state.connect('highlightAssetStudies', value);
    }

    constructor() {
        this.state.set(initialMapState);

        this._lc.afterViewInit$
            .pipe(take(1), subscribeOn(asyncScheduler), untilDestroyed(this))
            .subscribe(() => this._ngAfterViewInit());
    }

    _ngAfterViewInit(): void {
        const raster = new TileLayer({
            source: new XYZ({
                url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg`,
            }),
        });

        const origin = {
            center: [900000, 5900000],
            zoom: 9,
        };
        const view = new View({
            projection: 'EPSG:3857',
            ...origin,
            minZoom: 7,
        });

        setTimeout(() => {
            fitToSwitzerland(view, false);
            const zoom = view.getZoom();
            if (zoom != null) {
                view.setMinZoom(zoom);
            }
        });

        const vectorSourceAllStudies = new VectorSource({ wrapX: false });
        const vectorLayerAllStudies = new VectorLayer({ source: vectorSourceAllStudies, minZoom: 11 });

        const heatmapClusterSource = new VectorSource({ wrapX: false });
        const source = new Cluster({
            distance: 2,
            source: heatmapClusterSource,
        }) as unknown as VectorSource<Point>;
        const heatmapLayer = new Heatmap({
            source,
            weight: feature => feature.get('features').length,
            maxZoom: 12,
            blur: 20,
            radius: 5,
            opacity: 0.7,
        });

        const vectorSourcePolygonSelection = new VectorSource({ wrapX: false });
        const vectorLayerPolygonSelection = new VectorLayer({ source: vectorSourcePolygonSelection });

        const vectorSourceGeoms = new VectorSource({ wrapX: false });
        const vectorLayerGeoms = new VectorLayer({ source: vectorSourceGeoms });

        const vectorSourceAssetGeoms = new VectorSource({ wrapX: false });
        const vectorLayerAssetGeoms = new VectorLayer({ source: vectorSourceAssetGeoms });

        const vectorSourcePickerMouseOver = new VectorSource({ wrapX: false });
        const vectorLayerPickerMouseOver = new VectorLayer({ source: vectorSourcePickerMouseOver });

        const zoomControlsInstance = this.createZoomControlsComponent().instance;
        const olMap = new Map({
            target: this.mapDiv.nativeElement,
            controls: olZoomControls(this._dcmnt, zoomControlsInstance),
            layers: [
                raster,
                heatmapLayer,
                vectorLayerAllStudies,
                vectorLayerGeoms,
                vectorLayerAssetGeoms,
                vectorLayerPolygonSelection,
                vectorLayerPickerMouseOver,
            ],
            view: view,
        });

        fromEventPattern(
            h => olMap.getView().on('change:resolution', h),
            h => olMap.getView().un('change:resolution', h),
        )
            .pipe(
                map(() => olMap.getView().getZoom()),
                distinctUntilChanged(),
                untilDestroyed(this),
            )
            .subscribe(zoom => {
                if (zoom == null) return;
                vectorSourceAllStudies.forEachFeature(f => {
                    const style = f.getStyle();
                    if (style instanceof Style) {
                        const image = style.getImage();
                        if (image instanceof Icon) {
                            image.setScale(zoom < 12 ? 1 : zoom / 7.5);
                        }
                        if (image instanceof CircleStyle) {
                            image.setRadius(zoom < 12 ? 4 : 4 * (zoom / 7.5));
                        }
                    }
                });
            });

        type AllStudyDTOWithGeometry = AllStudyDTO & { geometry: Point };
        const addPointGeometry = (study: AllStudyDTO): AllStudyDTOWithGeometry => {
            const lonLat = lv95ToWGS(study.centroid);
            return {
                ...study,
                geometry: new Point(fromLonLat([isoWGSLng.unwrap(lonLat.lng), isoWGSLat.unwrap(lonLat.lat)])),
            };
        };

        const mapInitialised$ = fromEventPattern(
            h => olMap.once('loadend', h),
            h => olMap.un('loadend', h),
        ).pipe(
            switchMap(() => this._allStudyService.getAllStudies()),
            ORD.fromFilteredSuccess,
            map(A.map(addPointGeometry)),
            withLatestFrom(this.state.select('rdStudies')),
            switchMap(([allStudies, rdStudies]) => {
                const makeHeatmapFeatures = () => allStudies.map(s => new Feature({ geometry: s.geometry }));
                clearVectorSourceThenAddFeatures(heatmapClusterSource, makeHeatmapFeatures);
                return this._windowService.delayRequestAnimationFrame(300, () => {
                    const makeVectorFeatures = () =>
                        allStudies.map(s =>
                            decorateFeature(new Feature({ geometry: s.geometry }), {
                                id: s.studyId,
                                style: s.isPoint ? featureStyles.pointStyle : featureStyles.rhombusStyle,
                            }),
                        );
                    clearVectorSourceThenAddFeatures(vectorSourceAllStudies, makeVectorFeatures);
                    if (RD.isSuccess(rdStudies)) {
                        rdStudies.value.forEach(s => {
                            const f = vectorSourceAllStudies.getFeatureById(s.studyId);
                            f?.set('previousStyle', f?.getStyle());
                            f?.setStyle(featureStyles.undefinedStyle);
                        });
                    }
                });
            }),
            take(1),
        );
        this.state.connect(mapInitialised$, () => ({ isMapInitialised: true }));

        this.state.connect('polygon', this.polygonChanged$.pipe(map(O.some)));

        const draw = new Draw({ source: vectorSourcePolygonSelection, type: 'Polygon' });

        this.state
            .select(['rdCurrentAssetDetail', 'rdStudies'], identity)
            .pipe(untilDestroyed(this))
            .subscribe(({ rdCurrentAssetDetail, rdStudies }) => {
                if (RD.isInitial(rdCurrentAssetDetail)) {
                    vectorSourceAssetGeoms.clear();
                    vectorLayerGeoms.setOpacity(1);
                    vectorLayerAllStudies.setOpacity(1);
                    if (RD.isSuccess(rdStudies)) {
                        zoomToStudies(this._windowService, olMap, rdStudies.value, 0.6);
                    }
                }
                if (RD.isSuccess(rdCurrentAssetDetail)) {
                    vectorSourceAssetGeoms.clear();
                    vectorLayerGeoms.setOpacity(0.5);
                    vectorLayerAllStudies.setOpacity(0.5);
                    zoomToStudies(this._windowService, olMap, rdCurrentAssetDetail.value.studies, 0.3);
                    const studiesWithFeature = createFeaturesFromStudies(rdCurrentAssetDetail.value.studies, {
                        point: featureStyles.bigPointStyleAsset,
                        polygon: featureStyles.polygonStyleAsset,
                        lineString: featureStyles.lineStringStyleAsset,
                    });
                    vectorSourceAssetGeoms.addFeatures(studiesWithFeature.map(s => s.olGeometry));
                }
            });

        zoomControlsInstance._zoomOriginClicked$.pipe(untilDestroyed(this)).subscribe(() => {
            fitToSwitzerland(view, true);
        });

        this.state
            .select('rdStudies')
            .pipe(untilDestroyed(this))
            .subscribe(rd => {
                if (RD.isInitial(rd)) {
                    vectorSourcePolygonSelection.clear();
                }
                if (RD.isSuccess(rd)) {
                    vectorSourceGeoms.clear();
                    zoomToStudies(this._windowService, olMap, rd.value, 0.6);
                    const studiesWithFeature = createFeaturesFromStudies(rd.value, {
                        point: featureStyles.bigPointStyle,
                        polygon: featureStyles.polygonStyle,
                        lineString: featureStyles.lineStringStyle,
                    });
                    studiesWithFeature
                        .map(s => vectorSourceAllStudies.getFeatureById(s.studyId))
                        .forEach(f => {
                            f?.set('previousStyle', f?.getStyle());
                            f?.setStyle(featureStyles.undefinedStyle);
                        });
                    vectorSourceGeoms.addFeatures(studiesWithFeature.map(s => s.olGeometry));
                } else {
                    vectorSourceAllStudies.forEachFeature(f => {
                        if (f.get('previousStyle')) {
                            f.setStyle(f.get('previousStyle'));
                            f.set('previousStyle', undefined);
                        }
                    });
                    vectorSourceGeoms.forEachFeature(f => vectorSourceGeoms.removeFeature(f));
                }
            });

        const polygon$ = this.state.select('polygon');

        merge(
            fromEventPattern<DrawEvent>(
                h => draw.on('drawstart', h),
                h => draw.un('drawstart', h),
            ),
            polygon$.pipe(filter(O.isNone)),
        )
            .pipe(untilDestroyed(this))
            .subscribe(() => {
                vectorSourcePolygonSelection.clear();
            });

        const drawEnd$ = fromEventPattern<DrawEvent>(
            h => draw.on('drawend', h),
            h => draw.un('drawend', h),
        ).pipe(share());

        const featureToLV95Polygon = (f: Feature<Geometry>) =>
            pipe(
                f.getGeometry(),
                O.fromNullable,
                O.chain(geometry => (geometry.getType() === 'Polygon' ? O.some(geometry as Polygon) : O.none)),
                O.map(g => pipe(g.getFlatCoordinates(), makePairs, A.map(toLonLat), A.map(WGStoLV95))),
            );

        polygon$.pipe(OO.fromFilteredSome, untilDestroyed(this)).subscribe(polygon => {
            const polygonFromMap = pipe(
                vectorSourcePolygonSelection.getFeatures(),
                NEA.fromArray,
                O.map(NEA.head),
                O.chain(featureToLV95Polygon),
            );

            if (!O.getEq(eqLV95Array).equals(O.some(polygon), polygonFromMap)) {
                vectorSourcePolygonSelection.clear();
                vectorSourcePolygonSelection.addFeature(
                    new Feature({
                        geometry: new Polygon([olCoordsFromLV95Array(polygon)]),
                    }),
                );
            }
        });

        drawEnd$
            .pipe(
                map(e =>
                    pipe(
                        (e.feature.getGeometry() as Polygon).getFlatCoordinates(),
                        makePairs,
                        A.map(toLonLat),
                        A.map(WGStoLV95),
                    ),
                ),
                untilDestroyed(this),
            )
            .subscribe(polygon => {
                zoomControlsInstance.setDrawingMode(false);
                setTimeout(() => {
                    this.polygonChanged$.emit(polygon);
                });
            });

        this.state
            .select('drawingMode')
            .pipe(untilDestroyed(this))
            .subscribe(drawMode => {
                if (drawMode) {
                    olMap.addInteraction(draw);
                } else {
                    olMap.removeInteraction(draw);
                }
            });

        fromEventPattern<MapBrowserEvent<PointerEvent>>(
            h => olMap.on('click', h),
            h => olMap.un('click', h),
        )
            .pipe(
                withLatestFrom(this.state.select('drawingMode')),
                filter(([, drawingMode]) => !drawingMode),
                map(([event]) => event),
                withLatestFrom(this.state.select('rdStudies')),
                map(([event, rdStudies]) => rdSequenceProps({ event, rdStudies }, 'rdStudies')),
                ORD.fromFilteredSuccess,
                map(({ event, rdStudies: studies }) => {
                    const clickedFeatureIds: string[] = [];
                    olMap.forEachFeatureAtPixel(
                        event.pixel,
                        feature => {
                            const id = feature.getId();
                            id && clickedFeatureIds.push(String(id));
                        },
                        {
                            layerFilter: layer => layer === vectorLayerGeoms,
                        },
                    );
                    return pipe(
                        studies,
                        A.filter(s => clickedFeatureIds.includes(s.studyId)),
                        A.map(s => s.assetId),
                    );
                }),
                untilDestroyed(this),
            )
            .subscribe(this.assetClicked$);

        fromEventPattern<MapBrowserEvent<PointerEvent>>(
            h => olMap.on('click', h),
            h => olMap.un('click', h),
        )
            .pipe(
                withLatestFrom(this.state.select('selectionMode')),
                filter(([, selectionMode]) => selectionMode),
                switchMap(([event]) => {
                    return this._allStudyService.getAllStudies().pipe(
                        ORD.fromFilteredSuccess,
                        map(A.map(addPointGeometry)),
                        map(studies => ({
                            event,
                            studies,
                        })),
                    );
                }),
                map(({ event, studies }) => {
                    const clickedFeatureIds: string[] = [];
                    olMap.forEachFeatureAtPixel(
                        event.pixel,
                        feature => {
                            const id = feature.getId();
                            id && clickedFeatureIds.push(String(id));
                        },
                        {
                            layerFilter: layer => layer === vectorLayerAllStudies,
                        },
                    );
                    return pipe(
                        studies,
                        A.filter(s => clickedFeatureIds.includes(s.studyId)),
                        A.map(s => s.studyId),
                    );
                }),
            )
            .subscribe(ss => console.log(ss));

        this.state
            .select(['highlightAssetStudies', 'rdStudies'], ({ rdStudies, highlightAssetStudies }) =>
                pipe(
                    rdStudies,
                    RD.toOption,
                    O.chain(studies =>
                        pipe(
                            highlightAssetStudies,
                            O.map(assetId =>
                                pipe(
                                    studies,
                                    A.filter(s => s.assetId === assetId),
                                ),
                            ),
                        ),
                    ),
                ),
            )
            .pipe(untilDestroyed(this))
            .subscribe(studies => {
                if (O.isSome(studies)) {
                    const studiesWithFeature = createFeaturesFromStudies(studies.value, {
                        point: featureStyles.bigPointStyleAssetSelected,
                        polygon: featureStyles.polygonStyleAssetSelected,
                        lineString: featureStyles.lineStringStyleAssetSelected,
                    });
                    vectorSourcePickerMouseOver.addFeatures(studiesWithFeature.map(s => s.olGeometry));
                } else {
                    vectorSourcePickerMouseOver.clear();
                }
            });
    }

    createZoomControlsComponent() {
        const zoomControlsComponent = this._viewContainerRef.createComponent(ZoomControlsComponent);
        this.state.connect('drawingMode', zoomControlsComponent.instance.drawingMode$.pipe(delay(0)));
        return zoomControlsComponent;
    }
}

const clearVectorSourceThenAddFeatures = (vectorSource: VectorSource, f: Lazy<Feature[]>) => {
    const addFeatures = () => vectorSource.addFeatures(f());
    if (vectorSource.getFeatures().length === 0) {
        addFeatures();
    } else {
        vectorSource.once('clear', () => {
            addFeatures();
        });
        vectorSource.clear(false);
    }
};
