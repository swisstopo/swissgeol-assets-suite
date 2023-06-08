import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    QueryList,
    ViewChildren,
    inject,
} from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { RxState } from '@rx-angular/state';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { Eq, contramap } from 'fp-ts/Eq';
import { flow, pipe } from 'fp-ts/function';
import { Eq as eqNumber } from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import { Eq as eqString } from 'fp-ts/string';
import * as D from 'io-ts/Decoder';
import {
    Observable,
    combineLatest,
    distinctUntilChanged,
    filter,
    map,
    merge,
    share,
    shareReplay,
    startWith,
    switchMap,
    withLatestFrom,
} from 'rxjs';

import {
    CURRENT_LANG,
    FormValidationError,
    LifecycleHooks,
    LifecycleHooksDirective,
    formValidationError,
    formValidationErrorTag,
    formatDate,
    fromAppShared,
} from '@asset-sg/client-shared';
import {
    DT,
    OE,
    ORD,
    decodeError,
    eqStringArray,
    getEqArrayUnordered,
    isNil,
    isNotNil,
    partitionEither,
    rdEqOnlyRight,
} from '@asset-sg/core';
import {
    Contact,
    DateStruct,
    LV95,
    contactByName,
    dateIdFromDate,
    eqContact,
    getValueItemNameKey,
    usageCodes,
    valueItemRecordToSortedArray,
} from '@asset-sg/shared';
import { KobalteListbox, KobalteListboxItemProps } from 'ngx-kobalte';

import { BaseClientAssetSearchRefinement, RefinementGeomCode, refinementGeomCodes } from '../../models';
import * as fromAssetViewer from '../../state/asset-viewer.selectors';

interface AssetSearchRefineState {
    rdReferenceDataVM: fromAppShared.RDReferenceDataVM;
    rdRefineVM: fromAssetViewer.RDRefineVM;
    searchPolygon: O.Option<LV95[]>;
}

const initialState: AssetSearchRefineState = {
    rdReferenceDataVM: RD.initial,
    rdRefineVM: RD.initial,
    searchPolygon: O.none,
};

@UntilDestroy()
@Component({
    selector: 'asset-sg-asset-search-refine',
    templateUrl: './asset-search-refine.component.html',
    styleUrls: ['./asset-search-refine.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    hostDirectives: [LifecycleHooksDirective],
})
export class AssetSearchRefineComponent extends RxState<AssetSearchRefineState> {
    private _lc = inject(LifecycleHooks);
    private _formBuilder = inject(FormBuilder);
    private _currentLang$ = inject(CURRENT_LANG);
    private _translateService = inject(TranslateService);

    @Input()
    public set rdReferenceDataVM$(value: Observable<fromAppShared.RDReferenceDataVM>) {
        this.connect('rdReferenceDataVM', value);
    }

    @Input()
    public set rdRefineVM$(value: Observable<fromAssetViewer.RDRefineVM>) {
        this.connect('rdRefineVM', value);
    }

    @Input()
    public set searchPolygon$(value: Observable<O.Option<LV95[]>>) {
        this.connect('searchPolygon', value);
    }

    @Output('refinementChanged') public readonly refinementChanged$: Observable<
        O.Option<BaseClientAssetSearchRefinement>
    >;

    @Output('removePolygon') public readonly removePolygon$ = new EventEmitter<void>();

    @ViewChildren('usageListboxWrapper') private _usageListboxWrapper!: QueryList<ElementRef<HTMLDivElement>>;
    @ViewChildren('geomListboxWrapper') private _geomListboxWrapper!: QueryList<ElementRef<HTMLDivElement>>;
    @ViewChildren('languageListboxWrapper') private _languageListboxWrapper!: QueryList<ElementRef<HTMLDivElement>>;
    @ViewChildren('manCatLabelsListboxWrapper') private _manCatLabelsListboxWrapper!: QueryList<
        ElementRef<HTMLDivElement>
    >;
    @ViewChildren('assetKindListboxWrapper') private _assetKindListboxWrapper!: QueryList<ElementRef<HTMLDivElement>>;

    public formGroup = this._formBuilder.group({
        author: new FormControl<Contact | string | null>(null),
        createDateFrom: new FormControl<Date | null>(null, { updateOn: 'blur' }),
        createDateTo: new FormControl<Date | null>(null, { updateOn: 'blur' }),
        manCatLabelItemCodes: new FormControl<string[]>([]),
        assetKindItemCodes: new FormControl<string[]>([]),
        usageCodes: new FormControl<string[]>([]),
        geomCodes: new FormControl<RefinementGeomCode[]>([]),
        languageItemCodes: new FormControl<string[]>([]),
    });

    public authorsFiltered$: Observable<Array<Contact>>;

    public createDateRange$: Observable<{ min: DateStruct | null; max: DateStruct | null }>;

    public formErrorMessages$: Observable<FormErrorMessages>;

    public _rdReferenceDataVM$ = this.select('rdReferenceDataVM');
    private _rdRefineVM$ = this.select('rdRefineVM');

    public _searchPolygon$ = this.select(['rdRefineVM', 'searchPolygon'], ({ rdRefineVM, searchPolygon }) =>
        pipe(
            rdRefineVM,
            RD.toOption,
            O.chain(a => a.refinement),
            O.filter(a => a.type === 'text'),
            O.chain(() => searchPolygon),
        ),
    );

    constructor() {
        super();

        this.set(initialState);

        const refineVM$ = this._rdRefineVM$.pipe(
            filter(RD.isSuccess),
            map(a => a.value),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        refineVM$
            .pipe(
                map(({ refinement, aggregations }) =>
                    pipe(
                        refinement,
                        O.map(refinement => ({
                            author: pipe(
                                refinement.authorId,
                                O.map(a => aggregations.buckets.authors.find(b => b.id === a) || null),
                                O.toNullable,
                            ),
                            createDateFrom: pipe(
                                refinement.createDateFrom,
                                O.map(a => a.date),
                                O.toNullable,
                            ),
                            createDateTo: pipe(
                                refinement.createDateTo,
                                O.map(a => a.date),
                                O.toNullable,
                            ),
                        })),
                        O.getOrElseW(() => ({
                            author: null,
                            createDateFrom: null,
                            createDateTo: null,
                        })),
                    ),
                ),
                untilDestroyed(this),
            )
            .subscribe(({ author, createDateFrom, createDateTo }) => {
                this.formGroup.patchValue({ author, createDateFrom, createDateTo }, { emitEvent: false });
            });

        const rdSearchAggregations$ = refineVM$.pipe(map(vm => vm.aggregations));

        const authors$ = rdSearchAggregations$.pipe(
            map(aggregations => aggregations.buckets.authors),
            startWith([]),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.createDateRange$ = rdSearchAggregations$.pipe(
            map(aggregations => ({
                min: aggregations.ranges.createDate.min,
                max: aggregations.ranges.createDate.max,
            })),
            startWith({ min: null, max: null }),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const validatedForm$ = this.formGroup.valueChanges.pipe(
            map(() => (this.formGroup.valid ? E.right(this.formGroup.value) : E.left(formValidationError()))),
            OE.chainOfW(
                flow(
                    pipe(
                        D.struct({
                            author: DT.optionFromNullable(Contact),
                            createDateFrom: DT.optionFromNullableDate,
                            createDateTo: DT.optionFromNullableDate,
                            manCatLabelItemCodes: D.array(D.string),
                            assetKindItemCodes: D.array(D.string),
                            usageCodes: D.array(D.string),
                            languageItemCodes: D.array(D.string),
                            geomCodes: D.array(RefinementGeomCode),
                        }),
                        D.map(a => {
                            const { author, ...rest } = a;
                            return {
                                ...rest,
                                authorId: pipe(
                                    author,
                                    O.map(a => a.id),
                                ),
                                createDateFrom: pipe(a.createDateFrom, O.map(dateIdFromDate)),
                                createDateTo: pipe(a.createDateTo, O.map(dateIdFromDate)),
                                assetKindItemCodes: O.some(a.assetKindItemCodes),
                                manCatLabelItemCodes: O.some(a.manCatLabelItemCodes),
                                languageItemCodes: O.some(a.languageItemCodes),
                                usageCodes: O.some(a.usageCodes),
                                geomCodes: O.some(a.geomCodes),
                            };
                        }),
                    ).decode,
                    E.mapLeft(decodeError),
                ),
            ),
            shareReplay({ refCount: true, bufferSize: 1 }),
        );
        const [notValid$, valid$] = partitionEither(validatedForm$);

        const [notValidDoNotSend$, notValidButSendDefaults$] = partitionEither(
            notValid$.pipe(
                filter((a): a is FormValidationError => a._tag === formValidationErrorTag),
                withLatestFrom(this.createDateRange$),
                map(
                    ([, { min, max }]): E.Either<
                        FormErrorMessages,
                        { messages: FormErrorMessages; formValue: BaseClientAssetSearchRefinement }
                    > => {
                        if (this.formGroup.controls['author'].invalid) {
                            return E.left({
                                author: O.some('Ungültig'),
                                createDateFrom: O.none,
                                createDateTo: O.none,
                            });
                        }
                        if (!min || !max) {
                            return E.left({
                                author: O.none,
                                createDateFrom:
                                    this.formGroup.controls['createDateFrom'].invalid && !min
                                        ? O.some('Ungültig')
                                        : O.none,
                                createDateTo:
                                    this.formGroup.controls['createDateTo'].invalid && !max
                                        ? O.some('Ungültig')
                                        : O.none,
                            });
                        }
                        return E.right({
                            messages: {
                                author: O.none,
                                createDateFrom:
                                    this.formGroup.controls['createDateFrom'].errors &&
                                    this.formGroup.controls['createDateFrom'].errors['matDatepickerMin']
                                        ? O.some(`Ausserhalb des Bereichs. ${formatDate(min.date)} wird verwendet.`)
                                        : this.formGroup.controls['createDateFrom'].errors &&
                                          this.formGroup.controls['createDateFrom'].errors['matDatepickerParse']
                                        ? O.some(`Ungültiges Datum. ${formatDate(min.date)} wird verwendet.`)
                                        : O.none,
                                createDateTo:
                                    this.formGroup.controls['createDateTo'].errors &&
                                    this.formGroup.controls['createDateTo'].errors['matDatepickerMax']
                                        ? O.some(`Ausserhalb des Bereichs. ${formatDate(max.date)} wird verwendet.`)
                                        : this.formGroup.controls['createDateTo'].errors &&
                                          this.formGroup.controls['createDateTo'].errors['matDatepickerParse']
                                        ? O.some(`Ungültiges Datum. ${formatDate(max.date)} wird verwendet.`)
                                        : O.none,
                            },
                            formValue: {
                                // TODO: THIS IS WRONG, get rid of no explicit any
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any
                                authorId: O.some(this.formGroup.controls['author'].value!) as any,
                                createDateFrom: O.some(
                                    !this.formGroup.controls['createDateFrom'].invalid
                                        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                          dateIdFromDate(this.formGroup.controls['createDateFrom'].value!)
                                        : min.dateId,
                                ),
                                createDateTo: O.some(
                                    !this.formGroup.controls['createDateTo'].invalid
                                        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                          dateIdFromDate(this.formGroup.controls['createDateTo'].value!)
                                        : max.dateId,
                                ),
                                manCatLabelItemCodes: O.some(
                                    this.formGroup.controls['manCatLabelItemCodes'].value || [],
                                ),
                                geomCodes: O.some(this.formGroup.controls['geomCodes'].value || []),
                                assetKindItemCodes: O.some(this.formGroup.controls['assetKindItemCodes'].value || []),
                                usageCodes: O.some(this.formGroup.controls['usageCodes'].value || []),
                                languageItemCodes: O.some(this.formGroup.controls['languageItemCodes'].value || []),
                            },
                        });
                    },
                ),
                shareReplay({ bufferSize: 1, refCount: true }),
            ),
        );

        this.formErrorMessages$ = merge(
            valid$.pipe(map(() => emptyFormErrorMessages)),
            notValidDoNotSend$,
            notValidButSendDefaults$.pipe(map(a => a.messages)),
        ).pipe(startWith(emptyFormErrorMessages), shareReplay({ bufferSize: 1, refCount: true }));

        const allListBoxValues$ = this._rdRefineVM$.pipe(
            ORD.toOption,
            map(
                flow(
                    O.map(a => a.aggregations.buckets),
                    O.getOrElseW(() => ({
                        manCatLabelItemCodes: [],
                        languageItemCodes: [],
                        usageCodes: [],
                        assetKindItemCodes: [],
                    })),
                ),
            ),
        );

        const transformListboxItemValues =
            <T>(eq: Eq<T>) =>
            (as: O.Option<T[]>, bs: T[]): O.Option<T[]> =>
                pipe(
                    as,
                    O.chain(_as => (getEqArrayUnordered(eq).equals(_as, bs) ? O.none : O.some(_as))),
                );

        this.refinementChanged$ = merge(valid$, notValidButSendDefaults$.pipe(map(a => a.formValue))).pipe(
            withLatestFrom(allListBoxValues$),
            map(([formValue, allListBoxValues]) =>
                O.some({
                    ...formValue,
                    geomCodes: formValue.geomCodes,
                    manCatLabelItemCodes: transformListboxItemValues(eqString)(
                        formValue.manCatLabelItemCodes,
                        allListBoxValues.manCatLabelItemCodes,
                    ),
                    usageCodes: transformListboxItemValues(eqString)(formValue.usageCodes, allListBoxValues.usageCodes),
                    assetKindItemCodes: transformListboxItemValues(eqString)(
                        formValue.assetKindItemCodes,
                        allListBoxValues.assetKindItemCodes,
                    ),
                    languageItemCodes: transformListboxItemValues(eqString)(
                        formValue.languageItemCodes,
                        allListBoxValues.languageItemCodes,
                    ),
                }),
            ),
        );

        authors$.subscribe(authors => {
            this.formGroup.controls['author'].validator = includedInListValidator(eqContact)(authors, true);
        });

        this.authorsFiltered$ = combineLatest([
            authors$,
            this.formGroup.valueChanges.pipe(
                startWith(null),
                map(() => this.formGroup.value.author),
            ),
        ]).pipe(
            map(([authors, author]) =>
                pipe(
                    isFormContactContact(author)
                        ? authors.filter(a => a.id === author.id)
                        : pipe(
                              author,
                              O.fromNullable,
                              O.map(_author =>
                                  authors.filter(_a => _a.name.toLowerCase().includes(_author.toLowerCase())),
                              ),
                              O.getOrElse(() => authors),
                          ),
                    A.sort(contactByName),
                ),
            ),
        );

        const eqRefineVMByTs: Eq<fromAssetViewer.RefineVM> = contramap((a: fromAssetViewer.RefineVM) => a.ts)(eqNumber);
        const eqRdRefineVMByTs = rdEqOnlyRight(eqRefineVMByTs);

        this._lc.afterViewInit$
            .pipe(
                switchMap(() => this._languageListboxWrapper.changes.pipe(startWith(null))),
                map(() => this._languageListboxWrapper.first?.nativeElement),
                filter(isNotNil),
                untilDestroyed(this),
            )
            .subscribe(element => {
                const initialValue$ = this._rdRefineVM$.pipe(
                    map(
                        flow(
                            RD.toOption,
                            O.map(a =>
                                pipe(
                                    a.refinement,
                                    O.map(r => r.languageItemCodes),
                                    O.getOrElseW(() => a.aggregations.buckets.languageItemCodes),
                                ),
                            ),
                            O.getOrElseW(() => []),
                        ),
                    ),
                    share(),
                );
                const value$ = merge(
                    initialValue$,
                    this.formGroup.valueChanges.pipe(map(a => a.languageItemCodes || [])),
                ).pipe(startWith([]), shareReplay({ bufferSize: 1, refCount: true }));
                value$.subscribe();

                const onValueChange = (value: Set<string>) => {
                    this.formGroup.patchValue({ languageItemCodes: Array.from(value) });
                };
                const rdRefineVM$ = this._rdRefineVM$.pipe(
                    distinctUntilChanged(eqRdRefineVMByTs.equals),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );
                initialValue$.subscribe(languageItemCodes => {
                    const formLanguageItemCodes = this.formGroup.getRawValue().languageItemCodes || [];
                    if (!eqStringArray.equals(languageItemCodes, formLanguageItemCodes)) {
                        this.formGroup.patchValue({ languageItemCodes }, { emitEvent: false });
                    }
                });

                const items$ = combineLatest([this._rdReferenceDataVM$, rdRefineVM$, this._currentLang$]).pipe(
                    map(([rdReferenceDataVM, rdRefineVM, currentLang]) =>
                        pipe(
                            RD.combine(rdReferenceDataVM, rdRefineVM),
                            RD.map(([referenceDataVM, refineVM]) => ({ referenceDataVM, refineVM, currentLang })),
                        ),
                    ),
                    ORD.map(({ referenceDataVM, refineVM, currentLang }) => {
                        const key = getValueItemNameKey(currentLang);
                        return valueItemRecordToSortedArray(referenceDataVM.languageItems, key).map(valueItem => ({
                            children: valueItem[key],
                            value: valueItem.code,
                            isDisabled: isNil(
                                refineVM.aggregations.buckets.languageItemCodes.find(c => c === valueItem.code),
                            ),
                        }));
                    }),
                    map(RD.getOrElse((): KobalteListboxItemProps[] => [])),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );

                KobalteListbox(
                    element,
                    {
                        selectionMode: 'multiple',
                        shouldFocusWrap: true,
                        value$,
                        onValueChange,
                    },
                    items$,
                );
            });

        this._lc.afterViewInit$
            .pipe(
                switchMap(() => this._usageListboxWrapper.changes.pipe(startWith(null))),
                map(() => this._usageListboxWrapper.first?.nativeElement),
                filter(isNotNil),
                untilDestroyed(this),
            )
            .subscribe(element => {
                const initialValue$ = this._rdRefineVM$.pipe(
                    map(
                        flow(
                            RD.toOption,
                            O.map(a =>
                                pipe(
                                    a.refinement,
                                    O.map(r => r.usageCodes),
                                    O.getOrElseW(() => a.aggregations.buckets.usageCodes),
                                ),
                            ),
                            O.getOrElseW(() => []),
                        ),
                    ),
                    share(),
                );
                const value$ = merge(
                    initialValue$,
                    this.formGroup.valueChanges.pipe(map(a => a.usageCodes || [])),
                ).pipe(startWith([]), shareReplay({ bufferSize: 1, refCount: true }));
                value$.subscribe();

                const onValueChange = (value: Set<string>) => {
                    this.formGroup.patchValue({ usageCodes: Array.from(value) });
                };
                const rdRefineVM$ = this._rdRefineVM$.pipe(
                    distinctUntilChanged(eqRdRefineVMByTs.equals),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );
                initialValue$.subscribe(usageCodes => {
                    const formUsageCodes = (this.formGroup.getRawValue().usageCodes as string[]) || [];
                    if (!eqStringArray.equals(usageCodes, formUsageCodes)) {
                        this.formGroup.patchValue({ usageCodes }, { emitEvent: false });
                    }
                });

                const items$ = combineLatest([
                    rdRefineVM$,
                    this._translateService.onLangChange.pipe(startWith(null)),
                ]).pipe(
                    map(([rdRefineVM]) =>
                        pipe(
                            rdRefineVM,
                            RD.map(refineVM =>
                                usageCodes.map(usageCode => ({
                                    children: this._translateService.instant(`search.usageCode.${usageCode}`),
                                    value: usageCode,
                                    isDisabled: isNil(
                                        refineVM.aggregations.buckets.usageCodes.find(c => c === usageCode),
                                    ),
                                })),
                            ),
                        ),
                    ),
                    map(RD.getOrElse((): KobalteListboxItemProps[] => [])),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );

                KobalteListbox(
                    element,
                    {
                        selectionMode: 'multiple',
                        shouldFocusWrap: true,
                        value$,
                        onValueChange,
                    },
                    items$,
                );
            });

        this._lc.afterViewInit$
            .pipe(
                switchMap(() => this._geomListboxWrapper.changes.pipe(startWith(null))),
                map(() => this._geomListboxWrapper.first?.nativeElement),
                filter(isNotNil),
                untilDestroyed(this),
            )
            .subscribe(element => {
                const initialValue$ = this._rdRefineVM$.pipe(
                    map(
                        flow(
                            RD.toOption,
                            O.map(a =>
                                pipe(
                                    a.refinement,
                                    O.map(r => r.geomCodes),
                                    O.getOrElseW(() => a.aggregations.buckets.geomCodes),
                                ),
                            ),
                            O.getOrElseW(() => []),
                        ),
                    ),
                    share(),
                );

                const value$ = merge(initialValue$, this.formGroup.valueChanges.pipe(map(a => a.geomCodes || []))).pipe(
                    startWith([]),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );
                value$.subscribe();

                const onValueChange = (value: Set<string>) => {
                    this.formGroup.patchValue({ geomCodes: Array.from(value) as RefinementGeomCode[] });
                };
                const rdRefineVM$ = this._rdRefineVM$.pipe(
                    distinctUntilChanged(eqRdRefineVMByTs.equals),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );
                initialValue$.subscribe(geomCodes => {
                    const formGeometryCodes = (this.formGroup.getRawValue().geomCodes as string[]) || [];
                    if (!eqStringArray.equals(geomCodes, formGeometryCodes)) {
                        this.formGroup.patchValue({ geomCodes }, { emitEvent: false });
                    }
                });

                const items$ = combineLatest([
                    rdRefineVM$,
                    this._translateService.onLangChange.pipe(startWith(null)),
                ]).pipe(
                    map(([rdRefineVM]) =>
                        pipe(
                            rdRefineVM,
                            RD.map(refineVM =>
                                refinementGeomCodes.map(geomCode => ({
                                    children: this._translateService.instant(`search.geometryCode.${geomCode}`),
                                    value: geomCode,
                                    isDisabled: isNil(
                                        refineVM.aggregations.buckets.geomCodes.find(c => c === geomCode),
                                    ),
                                })),
                            ),
                        ),
                    ),
                    map(RD.getOrElse((): KobalteListboxItemProps[] => [])),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );

                KobalteListbox(
                    element,
                    {
                        selectionMode: 'multiple',
                        shouldFocusWrap: true,
                        value$,
                        onValueChange,
                    },
                    items$,
                );
            });

        this._lc.afterViewInit$
            .pipe(
                switchMap(() => this._assetKindListboxWrapper.changes.pipe(startWith(null))),
                map(() => this._assetKindListboxWrapper.first?.nativeElement),
                filter(isNotNil),
                untilDestroyed(this),
            )
            .subscribe(element => {
                const initialValue$ = this._rdRefineVM$.pipe(
                    map(
                        flow(
                            RD.toOption,
                            O.map(a =>
                                pipe(
                                    a.refinement,
                                    O.map(r => r.assetKindItemCodes),
                                    O.getOrElseW(() => a.aggregations.buckets.assetKindItemCodes),
                                ),
                            ),
                            O.getOrElseW(() => []),
                        ),
                    ),
                    share(),
                );
                const value$ = merge(
                    initialValue$,
                    this.formGroup.valueChanges.pipe(map(a => a.assetKindItemCodes || [])),
                ).pipe(startWith([]), shareReplay({ bufferSize: 1, refCount: true }));
                value$.subscribe();

                const onValueChange = (value: Set<string>) => {
                    this.formGroup.patchValue({ assetKindItemCodes: Array.from(value) });
                };

                const rdRefineVM$ = this._rdRefineVM$.pipe(
                    distinctUntilChanged(eqRdRefineVMByTs.equals),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );
                initialValue$.subscribe(assetKindItemCodes => {
                    const formAssetKindItemCodes = this.formGroup.getRawValue().assetKindItemCodes || [];
                    if (!eqStringArray.equals(assetKindItemCodes, formAssetKindItemCodes)) {
                        this.formGroup.patchValue({ assetKindItemCodes }, { emitEvent: false });
                    }
                });

                const items$ = combineLatest([this._rdReferenceDataVM$, rdRefineVM$, this._currentLang$]).pipe(
                    map(([rdReferenceDataVM, rdRefineVM, currentLang]) =>
                        pipe(
                            RD.combine(rdReferenceDataVM, rdRefineVM),
                            RD.map(([referenceDataVM, refineVM]) => ({ referenceDataVM, refineVM, currentLang })),
                        ),
                    ),
                    ORD.map(({ referenceDataVM, refineVM, currentLang }) => {
                        const key = getValueItemNameKey(currentLang);
                        return valueItemRecordToSortedArray(referenceDataVM.assetKindItems, key).map(valueItem => ({
                            children: valueItem[key],
                            value: valueItem.code,
                            isDisabled: isNil(
                                refineVM.aggregations.buckets.assetKindItemCodes.find(c => c === valueItem.code),
                            ),
                        }));
                    }),
                    map(RD.getOrElse((): KobalteListboxItemProps[] => [])),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );

                KobalteListbox(
                    element,
                    {
                        selectionMode: 'multiple',
                        shouldFocusWrap: true,
                        value$,
                        onValueChange,
                    },
                    items$,
                );
            });

        this._lc.afterViewInit$
            .pipe(
                switchMap(() => this._manCatLabelsListboxWrapper.changes.pipe(startWith(null))),
                map(() => this._manCatLabelsListboxWrapper.first?.nativeElement),
                filter(isNotNil),
                untilDestroyed(this),
            )
            .subscribe(element => {
                const initialValue$ = this._rdRefineVM$.pipe(
                    map(
                        flow(
                            RD.toOption,
                            O.map(a =>
                                pipe(
                                    a.refinement,
                                    O.map(r => r.manCatLabelItemCodes),
                                    O.getOrElseW(() => a.aggregations.buckets.manCatLabelItemCodes),
                                ),
                            ),
                            O.getOrElseW(() => []),
                        ),
                    ),
                    share(),
                );
                const value$ = merge(
                    initialValue$,
                    this.formGroup.valueChanges.pipe(map(a => a.manCatLabelItemCodes || [])),
                ).pipe(startWith([]), shareReplay({ bufferSize: 1, refCount: true }));
                value$.subscribe();

                const onValueChange = (value: Set<string>) => {
                    this.formGroup.patchValue({ manCatLabelItemCodes: Array.from(value) });
                };

                const rdRefineVM$ = this._rdRefineVM$.pipe(
                    distinctUntilChanged(eqRdRefineVMByTs.equals),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );
                initialValue$.subscribe(manCatLabelItemCodes => {
                    const formManCatLabelItemCodes = this.formGroup.getRawValue().manCatLabelItemCodes || [];
                    if (!eqStringArray.equals(manCatLabelItemCodes, formManCatLabelItemCodes)) {
                        this.formGroup.patchValue({ manCatLabelItemCodes }, { emitEvent: false });
                    }
                });

                const items$ = combineLatest([this._rdReferenceDataVM$, rdRefineVM$, this._currentLang$]).pipe(
                    map(([rdReferenceDataVM, rdRefineVM, currentLang]) =>
                        pipe(
                            RD.combine(rdReferenceDataVM, rdRefineVM),
                            RD.map(([referenceDataVM, refineVM]) => ({ referenceDataVM, refineVM, currentLang })),
                        ),
                    ),
                    ORD.map(({ referenceDataVM, refineVM, currentLang }) => {
                        const key = getValueItemNameKey(currentLang);
                        return valueItemRecordToSortedArray(referenceDataVM.manCatLabelItems, key).map(valueItem => ({
                            children: valueItem[key],
                            value: valueItem.code,
                            isDisabled: isNil(
                                refineVM.aggregations.buckets.manCatLabelItemCodes.find(c => c === valueItem.code),
                            ),
                        }));
                    }),
                    map(RD.getOrElse((): KobalteListboxItemProps[] => [])),
                    shareReplay({ bufferSize: 1, refCount: true }),
                );

                KobalteListbox(
                    element,
                    {
                        selectionMode: 'multiple',
                        shouldFocusWrap: true,
                        value$,
                        onValueChange,
                    },
                    items$,
                );
            });
    }

    public authorAutocompleteDisplayFn = (contact: Contact | null): string => {
        return contact ? contact.name : '';
    };
}

export const includedInListValidator =
    <T>(eq: Eq<T>) =>
    (allowedValues: T[], allowEmpty: boolean): ValidatorFn =>
    (control: AbstractControl): ValidationErrors | null => {
        const isNotAllowed =
            allowEmpty && !control.value ? false : !allowedValues.some(a => eq.equals(a, control.value));
        return isNotAllowed ? { notIncludedInList: { value: control.value } } : null;
    };

interface FormErrorMessages {
    author: O.Option<string>;
    createDateFrom: O.Option<string>;
    createDateTo: O.Option<string>;
}

const emptyFormErrorMessages: FormErrorMessages = {
    author: O.none,
    createDateFrom: O.none,
    createDateTo: O.none,
};

type FormContact = Contact | string | null | undefined;
const isFormContactContact = (a: FormContact): a is Contact => a != null && typeof a !== 'string';
