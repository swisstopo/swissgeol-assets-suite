import { formatNumber } from '@angular/common';
import * as RD from '@devexperts/remote-data-ts';
import { createSelector } from '@ngrx/store';
import booleanWithin from '@turf/boolean-within';
import { lineString, point, polygon } from '@turf/helpers';
import * as A from 'fp-ts/Array';
import { flow, pipe } from 'fp-ts/function';
import * as N from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import { Eq as eqString } from 'fp-ts/string';

import { ApiError, fromAppShared } from '@asset-sg/client-shared';
import { GetSuccessTypeOfRemoteData, isTruthy, oGetOrElse } from '@asset-sg/core';
import {
    Geom,
    ReferenceData,
    Study,
    dateStructFromDateId,
    linestringToPositions,
    ordStatusWorkByDate,
    pointToPosition,
    polygonToPositions,
    toPositions,
} from '@asset-sg/shared';

import {
    AssetDetail,
    BaseClientAssetSearchRefinement,
    ClientAssetSearchParams,
    ClientAssetSearchRefinement,
    RefinementGeomCode,
    SearchAssetClient,
    foldSearchAssetResultClient,
    getBaseRefinement,
    mapSearchAssetResultNonEmptyToRD,
} from '../models';
import { SearchAssetResultEmptyError } from '../utils';

import { AppStateWithAssetViewer } from './asset-viewer.reducer';

const assetViewerFeature = (state: AppStateWithAssetViewer) => state.assetViewer;

const selectMapInitialised = createSelector(assetViewerFeature, state => state.mapInitialised);
const selectIsRefineAndResultsOpen = createSelector(assetViewerFeature, state => state.isRefineAndResultsOpen);

export const selectAppInitialised = createSelector(
    selectMapInitialised,
    fromAppShared.selectRDReferenceData,
    (mapInitialised, rdReferenceData) => mapInitialised && RD.isSuccess(rdReferenceData),
);

export const selectRDSearchResult = createSelector(assetViewerFeature, state => state.rdSearchResult);

export const selectRDRefinePolygonSearchResult = createSelector(
    assetViewerFeature,
    state => state.rdRefinePolygonSearchResult,
);

export const selectRefinePolygonSearchAssetIds = createSelector(selectRDRefinePolygonSearchResult, rdResult =>
    pipe(
        rdResult,
        RD.toOption,
        O.map(
            foldSearchAssetResultClient(
                () => [],
                flow(
                    a => a.assets,
                    A.map(({ assetId }) => assetId),
                ),
            ),
        ),
    ),
);

export const selectRDCurrentAssetDetail = createSelector(assetViewerFeature, state => state.rdCurrentAssetDetail);

const bucketKeysFromBucketsWithCount = <A>(as: { key: A; count: number }[]) =>
    as.filter(a => a.count > 0).map(a => a.key);

export const selectRDSearchResultVM = createSelector(
    selectRDSearchResult,
    fromAppShared.selectRDReferenceData,
    (rdSearchResult, rdReferenceData) =>
        pipe(
            RD.combine(rdSearchResult, rdReferenceData),
            RD.chain(([searchResult, referenceData]) =>
                mapSearchAssetResultNonEmptyToRD(searchResult, sr => ({
                    ...sr,
                    ts: Date.now(), // TODO remove ts
                    aggregations: {
                        ...sr.aggregations,
                        ranges: {
                            createDate: {
                                min: dateStructFromDateId(sr.aggregations.ranges.createDate.min),
                                max: dateStructFromDateId(sr.aggregations.ranges.createDate.max),
                            },
                        },
                        buckets: {
                            ...sr.aggregations.buckets,
                            authors: bucketKeysFromBucketsWithCount(sr.aggregations.buckets.authorIds).map(
                                key => referenceData.contacts[key],
                            ),
                            assetKindItemCodes: bucketKeysFromBucketsWithCount(
                                sr.aggregations.buckets.assetKindItemCodes,
                            ),
                            languageItemCodes: bucketKeysFromBucketsWithCount(
                                sr.aggregations.buckets.languageItemCodes,
                            ),
                            usageCodes: bucketKeysFromBucketsWithCount(sr.aggregations.buckets.usageCodes),
                            manCatLabelItemCodes: bucketKeysFromBucketsWithCount(
                                sr.aggregations.buckets.manCatLabelItemCodes,
                            ),
                            geomCodes: [
                                sr.assets.some(a => a.studies.some(s => s.geom._tag === 'Point'))
                                    ? ('Point' as RefinementGeomCode)
                                    : null,
                                sr.assets.some(a => a.studies.some(s => s.geom._tag === 'Polygon'))
                                    ? ('Polygon' as RefinementGeomCode)
                                    : null,
                                sr.assets.some(a => a.studies.some(s => s.geom._tag === 'LineString'))
                                    ? ('LineString' as RefinementGeomCode)
                                    : null,
                                sr.assets.some(a => a.studies.length === 0) ? ('None' as RefinementGeomCode) : null,
                            ].filter(isTruthy),
                        },
                    },
                    assets: sr.assets.map(makeSearchAssetVM(referenceData)),
                })),
            ),
        ),
);

export const selectClientAssetQueryParams = createSelector(assetViewerFeature, state => state.clientAssetQueryParams);
export const selectClientAssetSearchParams = createSelector(selectClientAssetQueryParams, queryParams =>
    pipe(
        queryParams,
        O.chain(a => a.searchParams),
    ),
);

export const selectSearchText = createSelector(selectClientAssetSearchParams, searchParams =>
    pipe(
        searchParams,
        O.chain(
            ClientAssetSearchParams.matchStrict({
                text: a => O.some(a.searchText),
                polygon: a =>
                    pipe(
                        a.refinement,
                        O.chain(r => r.searchText),
                    ),
            }),
        ),
    ),
);

export const selectSearchPolygon = createSelector(selectClientAssetSearchParams, searchParams =>
    pipe(
        searchParams,
        O.chain(
            ClientAssetSearchParams.matchStrict({
                text: a =>
                    pipe(
                        a.refinement,
                        O.chain(r => r.polygon),
                    ),
                polygon: a => O.some(a.searchPolygon),
            }),
        ),
    ),
);

export const selectSearchParamsLeaderTextSearchFields = createSelector(selectClientAssetSearchParams, searchParams =>
    pipe(
        searchParams,
        O.filter(ClientAssetSearchParams.is.text),
        O.map(a => a.searchText),
    ),
);

export const selectSearchParamsLeaderPolygonSearchFields = createSelector(selectClientAssetSearchParams, searchParams =>
    pipe(
        searchParams,
        O.filter(ClientAssetSearchParams.is.polygon),
        O.map(a => ({
            polygon: a.searchPolygon,
            searchText: pipe(
                a.refinement,
                O.chain(r => r.searchText),
            ),
        })),
    ),
);

export const selectBaseRefinement = createSelector(selectClientAssetSearchParams, searchParams =>
    pipe(searchParams, O.chain(getBaseRefinement)),
);

export const selectBaseRefinementVM = createSelector(selectBaseRefinement, refinement =>
    pipe(
        refinement,
        O.map(r => ({
            ...r,
            createDateFrom: pipe(r.createDateFrom, O.map(dateStructFromDateId)),
            createDateTo: pipe(r.createDateTo, O.map(dateStructFromDateId)),
        })),
    ),
);

export const selectRDRefineVM = createSelector(
    selectRDSearchResultVM,
    selectBaseRefinementVM,
    (rdSearchResult, refinement) =>
        pipe(
            rdSearchResult,
            RD.map(({ aggregations, ts }) => ({
                ts,
                aggregations,
                refinement: pipe(
                    refinement,
                    O.map(a => ({
                        ...a,
                        usageCodes: oGetOrElse(a.usageCodes, aggregations.buckets.usageCodes),
                        languageItemCodes: oGetOrElse(a.languageItemCodes, aggregations.buckets.languageItemCodes),
                        assetKindItemCodes: oGetOrElse(a.assetKindItemCodes, aggregations.buckets.assetKindItemCodes),
                        manCatLabelItemCodes: oGetOrElse(
                            a.manCatLabelItemCodes,
                            aggregations.buckets.manCatLabelItemCodes,
                        ),
                        geomCodes: oGetOrElse(a.geomCodes, aggregations.buckets.geomCodes),
                    })),
                ),
            })),
        ),
);
export interface RefineVM extends GetSuccessTypeOfRemoteData<ReturnType<typeof selectRDRefineVM>> {}
export type RDRefineVM = RD.RemoteData<ApiError | SearchAssetResultEmptyError, RefineVM>;

export const selectRDSearchAssets = createSelector(
    selectRDSearchResultVM,
    selectClientAssetSearchParams,
    selectRefinePolygonSearchAssetIds,
    (rdSearchResult, refinement, assetIds) =>
        pipe(
            rdSearchResult,
            RD.map(searchResult => pipe(searchResult.assets, A.filter(doesAssetMatchRefinement(refinement, assetIds)))),
        ),
);

export interface StudyVM extends Study {
    assetId: number;
}
export type StudyVMs = Array<StudyVM>;
export const selectRDStudies = createSelector(selectRDSearchAssets, rdSearchAssets =>
    pipe(
        rdSearchAssets,
        RD.map(
            flow(
                A.map(asset =>
                    pipe(
                        asset.studies,
                        A.map(study => ({ ...study, assetId: asset.assetId })),
                    ),
                ),
                A.flatten,
            ),
        ),
    ),
);
export type RDStudiesVM = RD.RemoteData<ApiError | SearchAssetResultEmptyError, StudyVMs>;

const makeAssetDetailVM = (referenceData: ReferenceData, assetDetail: AssetDetail, locale: string) => {
    const {
        assetFormatItemCode,
        assetLanguages,
        assetKindItemCode,
        assetContacts,
        manCatLabelRefs,
        assetFormatCompositions,
        typeNatRels,
        assetMain,
        subordinateAssets,
        siblingXAssets,
        siblingYAssets,
        statusWorks,
        assetFiles,
        ...rest
    } = assetDetail;
    return {
        ...rest,
        assetKindItem: referenceData.assetKindItems[assetKindItemCode],
        assetFormatItem: referenceData.assetFormatItems[assetFormatItemCode],
        languages: assetLanguages.map(({ languageItem: { languageItemCode: code, ...restL } }) => ({ code, ...restL })),
        contacts: assetContacts.map(contact => makeAssetDetailContactVM(referenceData, contact)),
        manCatLabels: manCatLabelRefs.map(manCatLabelItemCode => referenceData.manCatLabelItems[manCatLabelItemCode]),
        assetFormatCompositions: assetFormatCompositions.map(
            assetFormatItemCode => referenceData.assetFormatItems[assetFormatItemCode],
        ),
        typeNatRels: typeNatRels.map(natRelItemCode => referenceData.natRelItems[natRelItemCode]),
        referenceAssets: [
            ...pipe(
                assetMain,
                O.map(a => [a]),
                O.getOrElseW(() => []),
            ),
            ...subordinateAssets,
            ...siblingXAssets,
            ...siblingYAssets,
        ],
        statusWorks: pipe(
            statusWorks,
            A.sort(ordStatusWorkByDate),
            A.map(a => {
                const { statusWorkItemCode, ...rest } = a;
                return { ...rest, statusWork: referenceData.statusWorkItems[statusWorkItemCode] };
            }),
        ),
        assetFiles: assetFiles.map(assetFile => {
            const _fileSize = assetFile.fileSize / 1024n / 1024n;
            const fileSize =
                _fileSize < 1 ? `< 1MB` : `${formatNumber(Number(bigIntRoundToMB(assetFile.fileSize)), locale)}MB`;
            return {
                ...assetFile,
                fileSize,
            };
        }),
    };
};
export interface AssetDetailVM extends ReturnType<typeof makeAssetDetailVM> {}

const makeAssetDetailContactVM = (referenceData: ReferenceData, assetContact: AssetDetail['assetContacts'][0]) => {
    const {
        role,
        contact: { contactKindItemCode, ...contactRest },
        ...assetContactRest
    } = assetContact;
    return {
        ...assetContactRest,
        role,
        ...contactRest,
        contactKindItem: referenceData.contactKindItems[contactKindItemCode],
    };
};
export interface AssetDetailContactVM extends ReturnType<typeof makeAssetDetailContactVM> {}

export const selectRDCurrentAssetDetailVM = createSelector(
    selectRDCurrentAssetDetail,
    fromAppShared.selectRDReferenceData,
    fromAppShared.selectLocale,
    (rdAssetDetail, rdReferenceData, locale) =>
        pipe(
            RD.combine(rdAssetDetail, rdReferenceData),
            RD.map(
                ([assetDetail, referenceData]): AssetDetailVM => makeAssetDetailVM(referenceData, assetDetail, locale),
            ),
        ),
);
export type RDCurrentAssetDetailVM = ReturnType<typeof selectRDCurrentAssetDetailVM>;

export interface DrawerState {
    showRefineOrStartSearch: 'show-refine' | 'show-start-search' | 'neither';
    showResults: boolean;
    showDetail: boolean;
}

export const selectDrawerState = createSelector(
    selectMapInitialised,
    selectRDCurrentAssetDetail,
    selectRDSearchResultVM,
    selectIsRefineAndResultsOpen,
    fromAppShared.selectIsPanelOpen,
    (mapInitialised, rdCurrentAssetDetail, rdSearchResultVM, isRefineAndResultsOpen, isPanelOpen): DrawerState =>
        !mapInitialised
            ? {
                  showRefineOrStartSearch: 'neither',
                  showResults: false,
                  showDetail: false,
              }
            : {
                  showRefineOrStartSearch:
                      !isPanelOpen || !isRefineAndResultsOpen
                          ? 'neither'
                          : pipe(
                                rdSearchResultVM,
                                RD.fold(
                                    () => 'show-start-search',
                                    () => 'show-refine',
                                    () => 'show-refine',
                                    () => 'show-refine',
                                ),
                            ),
                  showResults: isPanelOpen && isRefineAndResultsOpen && !RD.isInitial(rdSearchResultVM),
                  showDetail: !RD.isInitial(rdCurrentAssetDetail),
              },
);

const matchFromOption = <T>(a: O.Option<T>, predicate: (b: T) => boolean): boolean =>
    pipe(
        a,
        O.fold(() => true, predicate),
    );

const matchLanguageItemCode = (refinement: BaseClientAssetSearchRefinement, asset: SearchAssetVM): boolean =>
    pipe(
        refinement.languageItemCodes,
        O.map(cs => cs.some(languageCode => undefined !== asset.languageItems.find(({ code }) => code === languageCode))),
        O.getOrElse(() => true),
    );

const matchAssetKindItemCode = (refinement: BaseClientAssetSearchRefinement, asset: SearchAssetVM): boolean =>
    pipe(
        refinement.assetKindItemCodes,
        O.map(cs => cs.some(assetKindItemCode => assetKindItemCode === asset.assetKindItem.code)),
        O.getOrElse(() => true),
    );

const matchManCatLabelCodes = (refinement: BaseClientAssetSearchRefinement, asset: SearchAssetVM): boolean =>
    pipe(
        refinement.manCatLabelItemCodes,
        O.map(cs => A.intersection(eqString)(cs, asset.manCatLabelItemCodes).length > 0),
        O.getOrElse(() => true),
    );

const matchUsageRights = (refinement: BaseClientAssetSearchRefinement, asset: SearchAssetVM): boolean =>
    pipe(
        refinement.usageCodes,
        O.map(usageCodes => usageCodes.some(usageCode => usageCode === asset.usageCode)),
        O.getOrElse(() => true),
    );

const matchGeom = (refinement: BaseClientAssetSearchRefinement, asset: SearchAssetVM): boolean => {
    const assetGeomCodes = pipe(
        asset.studies,
        A.map(s => s.geom._tag),
        A.uniq(eqString),
    );
    return pipe(
        refinement.geomCodes,
        O.map(
            geomCodes =>
                (geomCodes.includes('None') && assetGeomCodes.length === 0) ||
                A.intersection(eqString)(geomCodes, assetGeomCodes).length > 0,
        ),
        O.getOrElse(() => true),
    );
};

const matchAssetIds = (assetIds: O.Option<number[]>, asset: SearchAssetVM): boolean =>
    pipe(
        assetIds,
        O.map(ids => ids.some(id => id === asset.assetId)),
        O.getOrElseW(() => true),
    );

const doesAssetMatchBaseRefinement =
    (asset: SearchAssetVM, assetIds: O.Option<number[]>) => (r: ClientAssetSearchRefinement) =>
        ClientAssetSearchRefinement.matchStrict<boolean>({
            polygon: () => matchAssetIds(assetIds, asset),
            text: t => {
                return pipe(
                    t.polygon,
                    O.map(p => {
                        const polygonAsFeature = polygon([toPositions(p)]);
                        return pipe(
                            asset.studies,
                            A.map(s =>
                                pipe(
                                    Geom.match({
                                        LineString: ls =>
                                            booleanWithin(lineString(linestringToPositions(ls)), polygonAsFeature),
                                        Polygon: a => booleanWithin(polygon([polygonToPositions(a)]), polygonAsFeature),
                                        Point: p => booleanWithin(point(pointToPosition(p)), polygonAsFeature),
                                    })(s.geom),
                                ),
                            ),
                        ).some(isTruthy);
                    }),
                    O.getOrElseW(() => true),
                );
            },
        })(r) &&
        matchUsageRights(r, asset) &&
        matchGeom(r, asset) &&
        matchLanguageItemCode(r, asset) &&
        matchAssetKindItemCode(r, asset) &&
        matchManCatLabelCodes(r, asset) &&
        matchFromOption(r.authorId, authorId => asset.contacts.some(a => N.Eq.equals(a.contact.id, authorId))) &&
        matchFromOption(r.createDateFrom, date => asset.createDate >= date) &&
        matchFromOption(r.createDateTo, date => asset.createDate <= date);

const doesAssetMatchRefinement =
    (searchParams: O.Option<ClientAssetSearchParams>, assetIds: O.Option<number[]>) => (asset: SearchAssetVM) =>
        pipe(
            searchParams,
            O.chain(getBaseRefinement),
            O.map(doesAssetMatchBaseRefinement(asset, assetIds)),
            O.getOrElseW(() => true),
        );

const _makeSearchAssetVM = (referenceData: ReferenceData) => (asset: SearchAssetClient) => {
    const { assetKindItemCode, assetFormatItemCode, contacts, languages, ...rest } = asset;
    return {
        ...rest,
        assetFormatItem: referenceData.assetFormatItems[assetFormatItemCode],
        assetKindItem: referenceData.assetKindItems[assetKindItemCode],
        manCatLabelItems: asset.manCatLabelItemCodes.map(code => referenceData.manCatLabelItems[code]),
        languageItems: languages.map(({ code }) => referenceData.languageItems[code]),
        authors: contacts
            .filter(c => c.role === 'author')
            .map(c => ({ role: c.role, contact: referenceData.contacts[c.id.toString()] })),
        contacts: contacts.map(c => ({ role: c.role, contact: referenceData.contacts[c.id.toString()] })),
    };
};
export interface SearchAssetVM extends ReturnType<ReturnType<typeof _makeSearchAssetVM>> {}
const makeSearchAssetVM: (referenceData: ReferenceData) => (asset: SearchAssetClient) => SearchAssetVM =
    _makeSearchAssetVM;

const bigIntRoundToMB = (value: bigint) => {
    const n = value / 1024n / 1024n;
    const rem = value - n * 1024n * 1024n;
    return rem > 524288n ? n + 1n : n;
};
