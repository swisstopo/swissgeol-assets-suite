import { formatNumber } from '@angular/common';
import { fromAppShared } from '@asset-sg/client-shared';
import {
    AssetEditDetail,
    Contact,
    DateRange,
    GeometryCode,
    LineString,
    LV95,
    ordStatusWorkByDate,
    Point,
    ReferenceData,
    Study,
    StudyPolygon,
    UsageCode,
    usageCodes,
    ValueCount,
    ValueItem,
} from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { createSelector } from '@ngrx/store';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import { AssetDetail } from '../../models';

import { AppStateWithAssetSearch } from './asset-search.reducer';

const assetSearchFeature = (state: AppStateWithAssetSearch) => state.assetSearch;

export const selectAssetSearchState = createSelector(assetSearchFeature, (state) => state);

export const selectSearchLoadingState = createSelector(assetSearchFeature, (state) => state.loadingState);

export const selectIsFiltersOpen = createSelector(assetSearchFeature, state => state.isFiltersOpen);

export const selectIsResultsOpen = createSelector(assetSearchFeature, state => state.isResultsOpen);

export const selectAssetDetailLoadingState = createSelector(
    assetSearchFeature,
    (state) => state.assetDetailLoadingState,
);

export const selectAssetSearchQuery = createSelector(assetSearchFeature, (state) => state.query);

export const selectAssetSearchResultData = createSelector(assetSearchFeature, (state) => state.results.data);

export const selectAssetSearchPageData = createSelector(assetSearchFeature, (state) => state.results.page);

export const selectAssetSearchPolygon = createSelector(assetSearchFeature, (state) => state.query.polygon);

export const selectStudies = createSelector(selectAssetSearchResultData, (assetEditDetails): StudyVM[] =>
    assetEditDetails.flatMap((assetEditDetail) =>
        assetEditDetail.studies.map((study) => {
            return {
                assetId: study.assetId,
                studyId: study.studyId,
                geom: wktToGeoJSON(study.geomText),
            };
        }),
    ),
);

export const selectAssetsSearchStats = createSelector(assetSearchFeature, (state) => state.stats);

export const selectCurrentAssetDetail = createSelector(assetSearchFeature, (state) => state.currentAsset);

export const selectCurrentAssetDetailVM = createSelector(
    fromAppShared.selectRDReferenceData,
    fromAppShared.selectLocale,
    selectCurrentAssetDetail,
    (referenceData, locale, currentAssetDetail) => {
        if (RD.isSuccess(referenceData) && !!currentAssetDetail) {
            return makeAssetDetailVMNew(referenceData.value, currentAssetDetail, locale);
        }
        return null as ReturnType<typeof makeAssetDetailVMNew> | null;
    },
);

export const selectContact = (
    contacts:
        | {
        role: string;
        contactId: number;
    }[]
        | undefined,
) =>
    createSelector(fromAppShared.selectRDReferenceData, (referenceData): FullContact[] | null => {
        if (RD.isSuccess(referenceData) && contacts) {
            return contacts.map((contact) => {
                return {
                    ...referenceData.value.contacts[contact.contactId],
                    role: contact.role,
                };
            });
        }
        return null;
    });

export const selectAssetKindItem = (assetKindItemCode?: string) =>
    createSelector(fromAppShared.selectRDReferenceData, (referenceData): ValueItem | null => {
        if (RD.isSuccess(referenceData) && assetKindItemCode) {
            return referenceData.value.assetKindItems[assetKindItemCode];
        }
        return null;
    });

export const selectAssetFormatItem = (assetFormatItemCode?: string) =>
    createSelector(fromAppShared.selectRDReferenceData, (referenceData): ValueItem | null => {
        if (RD.isSuccess(referenceData) && assetFormatItemCode) {
            return referenceData.value.assetFormatItems[assetFormatItemCode];
        }
        return null;
    });

export const selectManCatLabelItem = (manCatLabelRefs?: string[]) =>
    createSelector(fromAppShared.selectRDReferenceData, (referenceData): ValueItem[] | null => {
        if (RD.isSuccess(referenceData) && manCatLabelRefs) {
            return manCatLabelRefs.map((manCatLabelRef) => {
                return referenceData.value.manCatLabelItems[manCatLabelRef];
            });
        }
        return null;
    });

export const selectAvailableAuthors = createSelector(
    fromAppShared.selectRDReferenceData,
    selectAssetsSearchStats,
    (referenceData, stats): AvailableAuthor[] | null => {
        if (RD.isSuccess(referenceData)) {
            return stats.authorIds.map((authorId) => {
                return {
                    contactId: authorId.value,
                    count: authorId.count,
                    name: referenceData.value.contacts[authorId.value].name,
                };
            });
        }
        return null;
    },
);

export const selectCreateDate = createSelector(selectAssetsSearchStats, (stats): DateRange | null => stats.createDate);

export const selectUsageCodeData = createSelector(
    selectAssetsSearchStats,
    selectAssetSearchQuery,
    (stats, query): AvailableValueCount<UsageCode>[] => {
        return usageCodes.map((usageCode) => {
            const count = stats.usageCodes.find((item) => item.value === usageCode)?.count ?? 0;
            return {
                value: usageCode,
                count,
                isAvailable: count > 0,
                isActive: count > 0 && (query.usageCodes?.includes(usageCode) ?? true),
            };
        });
    },
);

export const selectAvailableAssetKindItems = createSelector(
    fromAppShared.selectRDReferenceData,
    selectAssetsSearchStats,
    selectAssetSearchQuery,
    (referenceData, stats, query): AvailableItem[] | null => {
        if (RD.isSuccess(referenceData)) {
            const assetKindItems: ValueItem[] = Object.values(referenceData.value.assetKindItems);
            return assetKindItems.flatMap((assetKindItem): AvailableItem => {
                const count = stats.assetKindItemCodes.find((item) => item.value === assetKindItem.code)?.count ?? 0;
                return {
                    item: assetKindItem,
                    count,
                    isAvailable: count > 0,
                    isActive: count > 0 && (query.assetKindItemCodes?.includes(assetKindItem.code) ?? true),
                };
            });
        }
        return null;
    },
);

export const selectAvailableLanguages = createSelector(
    fromAppShared.selectRDReferenceData,
    selectAssetsSearchStats,
    selectAssetSearchQuery,
    (referenceData, stats, query): AvailableItem[] | null => {
        if (RD.isSuccess(referenceData)) {
            const languageItems: ValueItem[] = Object.values(referenceData.value.languageItems);
            return languageItems.map((languageItem) => {
                const count = stats.languageItemCodes.find((item) => item.value === languageItem.code)?.count ?? 0;
                return {
                    item: languageItem,
                    count,
                    isAvailable: count > 0,
                    isActive: count > 0 && (query.languageItemCodes?.includes(languageItem.code) ?? true),
                };
            });
        }
        return null;
    },
);

export const selectAvailableGeometries = createSelector(
    selectAssetsSearchStats,
    selectAssetSearchQuery,
    (stats, query): AvailableValueCount<GeometryCode | 'None'>[] | null => {
        const geometries: Array<GeometryCode | 'None'> = Object.values(GeometryCode);
        geometries.push('None');
        const availableGeometries = geometries.map((geometry) => {
            const count = stats.geometryCodes.find((item) => item.value === geometry)?.count ?? 0;
            return {
                value: geometry,
                count: count,
                isAvailable: count > 0,
                isActive: count > 0 && (query.geomCodes?.includes(geometry) ?? true),
            };
        });
        return availableGeometries;
    },
);

export const selectAvailableManCatLabels = createSelector(
    fromAppShared.selectRDReferenceData,
    selectAssetsSearchStats,
    selectAssetSearchQuery,
    (referenceData, stats, query): AvailableItem[] | null => {
        if (RD.isSuccess(referenceData)) {
            const manCatLabels: ValueItem[] = Object.values(referenceData.value.manCatLabelItems);
            return manCatLabels.map((manCatLabel) => {
                const count = stats.manCatLabelItemCodes.find((item) => item.value === manCatLabel.code)?.count ?? 0;
                return {
                    item: manCatLabel,
                    count,
                    isAvailable: count > 0,
                    isActive: count > 0 && (query.manCatLabelItemCodes?.includes(manCatLabel.code) ?? true),
                };
            });
        }
        return null;
    },
);

export interface AvailableAuthor {
    contactId: number;
    count: number;
    name: string;
}

export interface FullContact extends Contact {
    role?: string;
}

export interface AvailableItem {
    item: ValueItem;
    count: number;
    isAvailable: boolean;
    isActive: boolean;
    displayName?: string;
}

export interface AvailableValueCount<T> extends ValueCount<T> {
    isAvailable: boolean;
    isActive: boolean;
}

export interface StudyVM extends Study {
    assetId: number;
}

const makeAssetDetailVMNew = (referenceData: ReferenceData, assetDetail: AssetEditDetail, locale: string) => {
    const {
        assetFormatItemCode,
        assetKindItemCode,
        assetContacts,
        assetLanguages,
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
        assetContacts: assetContacts
            .map((contact) => {
                return { role: contact.role, contact: referenceData.contacts[contact.contactId] };
            })
            .map((contact) => makeAssetDetailContactVM(referenceData, contact)),
        languages: assetLanguages,
        manCatLabels: manCatLabelRefs.map((manCatLabelItemCode) => referenceData.manCatLabelItems[manCatLabelItemCode]),
        assetFormatCompositions: assetFormatCompositions.map(
            (assetFormatItemCode) => referenceData.assetFormatItems[assetFormatItemCode],
        ),
        typeNatRels: typeNatRels.map((natRelItemCode) => referenceData.natRelItems[natRelItemCode]),
        referenceAssets: [
            ...pipe(
                assetMain,
                O.map((a) => [a]),
                O.getOrElseW(() => []),
            ),
            ...subordinateAssets,
            ...siblingXAssets,
            ...siblingYAssets,
        ],
        statusWorks: pipe(
            statusWorks,
            A.sort(ordStatusWorkByDate),
            A.map((a) => {
                const { statusWorkItemCode, ...rest } = a;
                return { ...rest, statusWork: referenceData.statusWorkItems[statusWorkItemCode] };
            }),
        ),
        assetFiles: assetFiles.map((assetFile) => {
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

const bigIntRoundToMB = (value: bigint) => {
    const n = value / 1024n / 1024n;
    const rem = value - n * 1024n * 1024n;
    return rem > 524288n ? n + 1n : n;
};

export function wktToGeoJSON(wkt: string) {
    if (wkt.startsWith('POINT')) {
        return parsePoint(wkt);
    } else if (wkt.startsWith('LINESTRING')) {
        return parseLineString(wkt);
    } else if (wkt.startsWith('POLYGON')) {
        return parsePolygon(wkt);
    } else {
        throw new Error(`Unsupported geometry type: ${wkt}`);
    }
}

function parsePoint(wkt: string): Point {
    const coord = getCoordinatesFromWKT(wkt)[0];
    return { _tag: 'Point', coord };
}

function parseLineString(wkt: string): LineString {
    const coords = getCoordinatesFromWKT(wkt);
    return { _tag: 'LineString', coords };
}

function parsePolygon(wkt: string): StudyPolygon {
    const coords = getCoordinatesFromWKT(wkt);
    return { _tag: 'Polygon', coords };
}

function getCoordinatesFromWKT(wkt: string): LV95[] {
    const match = wkt.startsWith('POLYGON') ? wkt.match(/\(\(([^)]+)\)\)/) : wkt.match(/\(([^)]+)\)/);
    if (!match) {
        return [];
    }
    const coordinateStrings = match[1].split(',');
    return coordinateStrings.map((coordStr) => {
        const [y, x] = coordStr.trim().split(' ').map(Number);
        return { x, y } as LV95;
    });
}
